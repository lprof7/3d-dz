#!/usr/bin/env bash
# build-myasp-zip.sh
# Builds a SOURCE ZIP for myASP.NET "Upload A Zip File".
#
# myASP.NET builds with Railpack, which:
#   1. copies ONLY the root *.csproj of the archive, then runs `dotnet restore`
#   2. copies the whole tree, then runs `dotnet publish --no-restore`
# A root csproj that references sibling projects (subfolders) will FAIL at the
# restore step ("Skipping project ... not found") because those projects are
# not yet copied, so their obj/project.assets.json never exists (NETSDK1004).
#
# Therefore this script flattens the whole backend into ONE self-contained
# root project: ThreeDDz.Api.csproj at the archive root, sibling projects
# merged into it as folders of source (Compile links) with all package
# references hoisted from every project into the root csproj, and no
# ProjectReference left behind.
#
# Usage: bash scripts/build-myasp-zip.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$PROJECT_DIR/backend/src"
STAGE="$PROJECT_DIR/publish/myasp-source"
ZIP_FILE="$PROJECT_DIR/publish/myasp-source-deploy.zip"

rm -rf "$STAGE"
mkdir -p "$STAGE"

# --- Copy ALL backend project source trees (without bin/obj) ---
for proj in ThreeDDz.Api ThreeDDz.Application ThreeDDz.Domain ThreeDDz.Infrastructure; do
  for item in "$SRC/$proj"/*; do
    name="$(basename "$item")"
    if [ "$name" = "bin" ] || [ "$name" = "obj" ]; then
      continue
    fi
    cp -R "$item" "$STAGE/$name"
  done
done

# --- Rebuild the root csproj as a single self-contained project ---
python3 - "$STAGE/ThreeDDz.Api.csproj" "$SRC" <<'PY'
import re, sys
from pathlib import Path

csproj_root, src = Path(sys.argv[1]), Path(sys.argv[2])
api = csproj_root.read_text(encoding="utf-8")

# Collect all PackageReference lines from every project (dedupe by name)
pkgs = {}
for proj in ("ThreeDDz.Api", "ThreeDDz.Application", "ThreeDDz.Domain", "ThreeDDz.Infrastructure"):
    for p in (src / proj).glob("*.csproj"):
        for line in p.read_text(encoding="utf-8").splitlines():
            m = re.search(r'<PackageReference\s+Include="([^"]+)"\s+Version="([^"]*)"\s*/>', line)
            if m:
                pkgs.setdefault(m.group(1), m.group(2))

# Drop any ProjectReference (sibling projects are merged below)
api = re.sub(r'\s*<ProjectReference[^>]*/>', '', api)

# Strip any existing package refs, then hoist the merged list
api = re.sub(r'\s*<PackageReference\s+Include="[^"]+"[^>]*?/>', '', api)
package_block = "\n  <ItemGroup>\n" + \
    "\n".join(f'    <PackageReference Include="{n}" Version="{v}" />' for n, v in pkgs.items()) + \
    "\n  </ItemGroup>"
api = api.replace("</Project>", package_block + "\n</Project>")

# Sibling sources are auto-included by the SDK's default `**/*.cs` glob,
# since the flattened stage puts them all under the project directory.
csproj_root.write_text(api, encoding="utf-8")
print(f"Merged {len(pkgs)} packages into single project {csproj_root.name}")
PY

# --- Remove leftover sibling .csproj files (their sources are merged above) ---
find "$STAGE" -maxdepth 1 -name "ThreeDDz.*.csproj" ! -name "ThreeDDz.Api.csproj" -delete

# --- Firebase: keep appsettings + Properties; drop Development config in Release ---
rm -f "$STAGE/appsettings.Development.json"

# --- Global.json is intentionally NOT pinned: the remote builder (Railpack)
# --- installs the SDK matching TargetFramework (net10.0) itself.

# --- Sanity: restore the merged single project from the staged root ---
( cd "$STAGE" && dotnet restore ThreeDDz.Api.csproj >/dev/null 2>&1 ) \
  || { echo "ERROR: dotnet restore failed on staged project — merge broken" >&2; exit 1; }

# --- Drop generated obj folders created by the sanity restore ---
find "$STAGE" -type d -name obj -prune -exec rm -rf {} +
find "$STAGE" -name "*.user" -delete

# --- Zip the staged source (contents at archive root) ---
rm -f "$ZIP_FILE"
python3 - "$STAGE" "$ZIP_FILE" <<'PY'
import sys
import zipfile
from pathlib import Path

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
skip = {"bin", "obj", "__pycache__", ".vs"}
with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for f in sorted(src.rglob("*")):
        if f.is_file() and not any(part in skip for part in f.relative_to(src).parts):
            zf.write(f, f.relative_to(src))
print(f"ZIP: {dest} ({dest.stat().st_size / 1048576:.1f} MB)")
PY

echo ""
echo "==> DONE. Upload this file via  myASP.NET -> Deployment -> Upload A Zip File:"
echo "    $ZIP_FILE"
echo "    (single flattened project: ThreeDDz.Api.csproj at root)"
echo ""
