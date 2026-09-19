#!/usr/bin/env bash
# publish-myasp.sh
# Publishes the ThreeDDz.Api and injects environment variables from .env
# into the generated web.config so the app runs on myASP.NET (IIS) hosting.
#
# Usage: bash scripts/publish-myasp.sh [output-dir]
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$PROJECT_DIR/backend/src/ThreeDDz.Api/ThreeDDz.Api.csproj"
ENV_FILE="$PROJECT_DIR/.env"
OUT_DIR="${1:-$PROJECT_DIR/publish/myasp}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env not found at $ENV_FILE" >&2
  exit 1
fi

echo "==> dotnet publish (framework-dependent, net10.0, OutOfProcess)..."
dotnet publish "$API_PROJECT" -c Release -o "$OUT_DIR" --no-self-contained -p:AspNetCoreHostingModel=OutOfProcess

# Remove files that should not be shipped (dev config, debug symbols)
find "$OUT_DIR" -name "appsettings.Development.json" -delete
find "$OUT_DIR" -name "*.pdb" -delete

echo "==> Injecting environment variables into web.config..."

WS=$(printf ' \t')

python3 - "$OUT_DIR/web.config" "$ENV_FILE" <<'PY'
import html
import re
import sys

web_config, env_file = sys.argv[1], sys.argv[2]

env = {}
with open(env_file, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key.startswith("VITE_"):
            continue  # frontend-only variable
        if key:
            env[key] = value

with open(web_config, encoding="utf-8") as f:
    text = f.read()

def xml_escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

vars_xml = "\n".join(
    '    <environmentVariable name="%s" value="%s" />' % (k, xml_escape(v))
    for k, v in env.items()
)

# Insert <environmentVariables> before the closing of <aspNetCore ... />
pattern = re.compile(r'<aspNetCore\b([^>]*?)\s*(/\s*>)', re.IGNORECASE)
def replace(m):
    return '<aspNetCore%s>\n    <environmentVariables>\n%s\n  </environmentVariables>\n  </aspNetCore>' % (
        m.group(1), vars_xml)

new_text, n = pattern.subn(replace, text, count=1)
if n == 0:
    sys.exit("ERROR: <aspNetCore> element not found in web.config")

with open(web_config, "w", encoding="utf-8") as f:
    f.write(new_text)

print("Injected environment variables: " + ", ".join(sorted(env.keys())))
PY

echo ""
echo "==> Creating deploy ZIP (contents of $OUT_DIR at archive root)..."
ZIP_FILE="$PROJECT_DIR/publish/myasp-deploy.zip"
rm -f "$ZIP_FILE"
python3 - "$OUT_DIR" "$ZIP_FILE" <<'PY'
import sys
import zipfile
from pathlib import Path

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for f in sorted(src.rglob("*")):
        if f.is_file():
            zf.write(f, f.relative_to(src))
print(f"ZIP: {dest} ({dest.stat().st_size / 1048576:.1f} MB)")
PY

echo ""
echo "==> DONE. Options to deploy to myASP.NET:"
echo "    1) Upload ZIP:      $ZIP_FILE"
echo "    2) Or FTP the files of: $OUT_DIR  (contents, not the folder itself)"
echo ""
