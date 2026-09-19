# دليل نشر مشروع 3D DZ (الدليل الشامل)

نشر **مجاني تمامًا وبدون بطاقة ائتمانية** = **MongoDB Atlas (M0)** + **myASP.NET** (الباكند كـ ASP.NET Core على IIS/Windows) أو **Render** (بديل Docker — يتطلب ربط بطاقة عند الإنشاء) + **Netlify أو Render Static** (الفرونت).

> بنية الريبو: `backend/` (ASP.NET Core net10.0) + `frontend/` (React + Vite SPA) + ملفات النشر في الجذر: `Dockerfile` + `render.yaml` + `scripts/publish-myasp.sh` + `scripts/build-myasp-zip.sh`.

> ⚠️ **مهم عن Render**: خطة free على Render تعمل، لكن إنشاء Web Service جديد قد يتطلب بطاقة للتحقق (فبراير 2025–2026). إن لم تصل البطاقة، استخدم **myASP.NET** (free trial 60 يوم بدون بطاقة) — يتبع أدناه في المرحلة 3.

---

## المرحلة 0 — التحقق المحلي

```bash
cd backend/src/ThreeDDz.Api
dotnet build
# شغّل محليًا:
MONGODB_CONNECTION="mongodb://localhost:27017" dotnet run
# في نافذة أخرى:
cd frontend
npm run dev
```

- الباكند محليًا على `http://localhost:5199` (launchSettings.json).
- الفرونت يمرر `/api` عبر proxy إلى 5199.

---

## المرحلة 1 — MongoDB Atlas (M0 المجاني)

1. سجّل في **https://www.mongodb.com/cloud/atlas**.
2. أنشئ **Cluster** → **M0 Free** → مورد قريب (مثال: Frankfurt).
3. Database Access → Add User (البيانات من `.env`).
4. Network Access → Add IP → **Allow Access from Anywhere** (`0.0.0.0/0`) حتى يصل أي خادم (Render أو myASP.NET).
5. انسخ Connection String من: Connect → Drivers.
6. ضعها في `.env`.

---

## المرحلة 2 — تخزين الأسرار

املأ `.env` (معفى من git):

```bash
MONGODB_CONNECTION=mongodb+srv://<USER>:<PASSWORD>@<cluster>.mongodb.net/
MONGODB_DB=3d-dz
JWT_SECRET=<قيمة عشوائية 32+ حرف>
JWT_ISSUER=3d-dz
JWT_AUDIENCE=3d-dz
IMAGEKIT_PUBLIC_KEY=public_xxx=
IMAGEKIT_PRIVATE_KEY=private_xxx=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<account_id>
VITE_API_BASE_URL=
```

---

## المرحلة 3 — النشر على Render (اختياري)

1. ادفع الكود إلى GitHub (`main`).
2. في **https://render.com** → **New → Blueprint** → اربط الريبو `lprof7/3d-dz` → يقرأ `render.yaml` تلقائيًا.
3. سيُنشئ خدمتين: `3ddz-api` (Docker web) و `3ddz-front` (static).
4. عيّن env vars من لوحة كل خدمة:
   - `3ddz-api`: `MONGODB_CONNECTION`, `MONGODB_DB`, `JWT_SECRET`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`.
   - `3ddz-front`: `VITE_API_BASE_URL` = `https://3ddz-api.onrender.com` (يُحقن وقت البناء).
5. **في Static Site Dashboard أضف قاعدة Rewrite**: Source `/*` → Destination `/index.html` (SPA — إلزامية لأن الواجهة تستخدم BrowserRouter). لا يمكن ضبط ذلك في `render.yaml`.
6. Atlas Network Access: اجعل `0.0.0.0/0` (عناوين Render متغيّرة).
7. تحقق: `https://3ddz-api.onrender.com/api/categories` → 200 JSON.

> خطة free:الخدمة تنام بعد 15 دقيقة خمول (أول طلب ~60 ثانية). لا حاجة لبطاقة لإنشاء Static Site; الـ Web Service قد يتطلبها.

---

## المرحلة 3ب — النشر على myASP.NET (بدون بطاقة، المُوصى به)

### 3ب.1 — سجّل التجربة المجانية
1. **https://www.myasp.net/freeaspnethosting** → سجّل (بدون بطاقة).
2. فعّل **60-Day Trial**. اختر Datacenter.
3. ستحصل على **Temp URL** مثل `http://<username>-001-site1.myASP.NET` + FTP info.

### 3ب.2 — أنشئ حزمة السورس

> ⚠️ خيار **Upload A Zip File** في myASP.NET **يبني من السورس** عبر Railpack: ينسخ `*.csproj` الجذر أولًا → `dotnet restore`، ثم ينسخ الشجرة → `dotnet publish --no-restore`. لذلك مشروع الجذر الذي فيه `ProjectReference` لمشاريع فرعية **يفشل** بـ `NETSDK1004`. السكربت يدمج المشاريع الأربعة في مشروع واحد مسطّح (ينزع كل ProjectReference ويجمع الحزم في csproj الجذر).

```bash
bash scripts/build-myasp-zip.sh
```
تنتج `publish/myasp-source-deploy.zip`.

### 3ب.3 — ارفع وضبط
1. لوحة myASP.NET → **Deployment → Upload A Zip File** → ارفع `publish/myasp-source-deploy.zip`.
2. افتح `http://<temp-url>/api/categories`.
3. عيّن env vars: لوحة التحكم → **Advance → Pool Manager → Actions → Environment Variables**: `MONGODB_CONNECTION`, `MONGODB_DB=3d-dz`, `JWT_SECRET`, `JWT_ISSUER=3d-dz`, `JWT_AUDIENCE=3d-dz`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`. (إن لم تصل المتغيرات للعملية، استخدم `SHOW_ERROR_DETAILS=1` مؤقتًا لفحص `mongodb_conn_set`.)

### 3ب.4 — بديل FTP
```bash
bash scripts/publish-myasp.sh
```
ينتج `publish/myasp` + `publish/myasp-deploy.zip` (OutOfProcess + env vars محقونة في web.config). ارفع المحتويات عبر FileZilla (وضع Passive).

> OutOfProcess مفروض في `ThreeDDz.Api.csproj` لأنه مطلوب للاستضافة المشتركة.

---

## المرحلة 4 — إبقاء الباكند مستيقظًا

على Render free: أضف cron عن طريق **https://cron-job.org** يستدعي `https://3ddz-api.onrender.com/api/categories` كل 10 دقائق.

---

## المرحلة 5 — نشر الفرونت

على Render: كما في المرحلة 3 (استخدم الـ static site من blueprint). على Netlify:
- `netlify.toml` يضبط build و SPAs.
- **Env var** إلزامي: `VITE_API_BASE_URL` = رابط الباكند بدون `/api`.
- `frontend/public/_redirects` يمنع 404 للمسارات العميقة.

---

## المرحلة 6 — ربط الفرونت بالباكند

- `VITE_API_BASE_URL` = `https://<backend-url>` (HTTPS يُفضَّل).
- CORS: الباكند يستخدم `AllowAnyOrigin`.

---

## المرحلة 7 — التحقق الكامل

- [ ] `GET https://<backend>/api/categories` → 200 JSON.
- [ ] تسجيل دخول admin → يعمل (`admin@3ddz.dz`).
- [ ] رفع صورة منتج → يعمل عبر ImageKit.
- [ ] مسارات SPA المباشرة (منع 404).
- [ ] نموذج 3D (GLB) يُعرض.
- [ ] لم تُستخدم بطاقة ائتمانية (إن سار النشر على myASP.NET).

---

## استكشاف الأخطاء الشائعة

| العَرَض | السبب | الحل |
|---|---|---|
| myASP.NET: `NETSDK1004` / "Skipping project" | ProjectReference لفرعية في جذر ZIP | أعد `bash scripts/build-myasp-zip.sh` (مشروع واحد مسطّح) |
| `Upload` يفشل: "Could not identify a project root" | رُفع ناتج publish بدل السورس | ارفع `publish/myasp-source-deploy.zip` |
| 500 / Timeout MongoDB: `Servers: []` | لا DNS/خروج خارجي من الاستضافة (myASP.NET يحجب خروج Atlas في بعض الخطط) | انتقل إلى Render (وصول إنترنت كامن) أو فعّل متغيرات من Pool Manager |
| Mixed Content | `VITE_API_BASE_URL` http والفرونت https | فعّل SSL/HTTPS أو غيّر الرابط لـ https |
| الفرونت لا يجد البيانات | `VITE_API_BASE_URL` فارغ/خاطئ | المرحلة 6؛ أعد البناء |
| فشل رفع صورة | `IMAGEKIT_PRIVATE_KEY` غير مضبوطة | أعد ضبطها في البيئة |
| (Render) صفحة تحميل طويلة لأول زيارة | خدمة free نائمة بعد 15 دقيقة | انتظر ~60 ثانية أو أضف cron |

---

> **أمان**: `.env` معفى من GitHub. لا ترفع `appsettings.Development.json` ولا ملفات بمفاتيح إلى الريبو. عند استخدام GitHub MCP في opencode، استخدم `${GITHUB_TOKEN}` أو env var بدل نص صريح.
