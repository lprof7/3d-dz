# دليل نشر مشروع 3D DZ (الدليل الشامل)

نشر **مجاني تمامًا وبدون بطاقة ائتمانية** = **MongoDB Atlas (M0)** + **Back4App Containers** (الباكند كـ Docker) + **Cloudflare Pages** (الفرونت كـ Static).

> بنية الريبو: `backend/` (ASP.NET Core net10.0) + `frontend/` (React + Vite SPA) + ملفات النشر في الجذر: `Dockerfile` + `render.yaml` (مرجع فقط).

> ⚠️ **لماذا لا Render ولا Koyeb؟** Render يطلب بطاقة للتحقق عند إنشاء أي Web Service (2025–2026). وKoyeb بعد استحواذ **Mistral** (فبراير 2026) لم يعد يقبل مستخدمين جدد إلا على خطط مدفوعة. الخيار المتبقي الموثوق **بدون بطاقة** مع دعم موثق لـ **ASP.NET** هو **Back4App Containers**، والفرونت على **Cloudflare Pages** (مجاني بلا بطاقة).

---

## المرحلة 0 — التحقق المحلي (اختياري لكن مُوصى به)

```bash
cd backend/src/ThreeDDz.Api
dotnet build
# شغّل محليًا:
MONGODB_CONNECTION="mongodb://localhost:27017" dotnet run
# في نافذة أخرى:
cd frontend
npm run dev
```

- الباكند يستمع على `http://localhost:5199` (يقرأ `PORT` إن وُجد، والحاوية مثبّتة على `5199` عبر `ASPNETCORE_URLS` في `Dockerfile`).
- الفرونت يمرر `/api` عبر proxy إلى 5199.

---

## المرحلة 1 — MongoDB Atlas (الخيار M0 المجاني)

1. سجّل/ادخل إلى **https://www.mongodb.com/cloud/atlas**.
2. أنشئ **Cluster جديد** → اختر النوع **M0 Free** (Spark) → اختر مورد قريب منك (e.g. Frankfurt) → أنشئه.
3. أنشئ **Database User** (بيانات الاعتماد التي سُجّلت في `.env`):
   - Database Access → Add New Database User → authentication password.
   - امنحه أذونات **readWriteAnyDatabase** (أو على الأساس `3d-dz`).
4. فعّل **Network Access**:
   - → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) حتى يصل Back4App من أي عنوان.
5. انسخ **Connection String** من: Cluster → Connect → Drivers:
   `mongodb+srv://<USER>:<PASSWORD>@<cluster>.mongodb.net/`
6. ضعها في ملف `.env`:
   ```
   MONGODB_CONNECTION=mongodb+srv://<USER>:<PASSWORD>@<cluster>.mongodb.net/
   MONGODB_DB=3d-dz
   ```
   > ⚠️ إذا كانت كلمة المرور تحتوي رموزًا خاصة مثل `!` أو `@`، يجب **ترميزها** (percent-encoding) داخل الرابط، أو استخدام قيمة كلمة المرور حرفيًا في `.env` — تذكّر أن `!` قد تُفسَّر في بعض الصدف (اقتبس القيمة عند الضرورة).

---

## المرحلة 2 — تخزين الأسرار مقدمًا

املأ ملف `.env` بكل القيم قبل بدء النشر (للصقها في لوحة Back4App لاحقًا):

```bash
# .env (موجود أصلًا في الجذر، ومعفى من git أمنيًا)
MONGODB_CONNECTION=mongodb+srv://...
MONGODB_DB=3d-dz

# مولّد أمن:  openssl rand -hex 32
JWT_SECRET=<قيمة عشوائية قوية 32+ حرف>
JWT_ISSUER=3d-dz
JWT_AUDIENCE=3d-dz

# ImageKit (من حساب ImageKit)
IMAGEKIT_PUBLIC_KEY=public_xxx=
IMAGEKIT_PRIVATE_KEY=private_xxx=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<account_id>

# الفرونت — تُملأ بعد النشر مباشرة (انظر المرحلة 5)
VITE_API_BASE_URL=
```

---

## المرحلة 3 — نشر الباكند على Back4App Containers (بدون بطاقة)

1. تأكد أن الكود **مدفوع** على GitHub: `git status` → مزامنة مع `origin/main`.
2. سجّل/ادخل إلى **https://www.back4app.com** → اختر **Containers** (خدمة الحاويات).
3. أنشئ الخدمة:
   - **Import GitHub Repo** → اربط GitHub → امنح صلاحيات المستودع → اختر `lprof7/3d-dz`.
   - **App Name:** `3ddz-api`
   - **Branch:** `main`
   - **Root Directory:** اتركه فارغًا (الجذر `.` — الـ `Dockerfile` في الجذر).
   - **Auto Deploy:** فعّلها (أي push للفرع `main` يُعيد البناء تلقائيًا).
   - **Plan:** **Free** (0.25 CPU / 256 MB RAM / 100 GB نقل — **لا بطاقة**).
4. **Environment Variables** (اضغط إضافة لكل متغير):
   - `PORT` = `5199` (مطابق لمنفذ الحاوية)
   - `MONGODB_CONNECTION` (من المرحلة 1)
   - `MONGODB_DB` = `3d-dz`
   - `JWT_SECRET`
   - `JWT_ISSUER` = `3d-dz`
   - `JWT_AUDIENCE` = `3d-dz`
   - `IMAGEKIT_PUBLIC_KEY`
   - `IMAGEKIT_PRIVATE_KEY`
   - `IMAGEKIT_URL_ENDPOINT` = `https://ik.imagekit.io/<account_id>`
5. **Port / Health Check** (اختياري لكن مُستحسن):
   - المنفذ يُقرأ تلقائيًا من `EXPOSE 5199` في الـ Dockerfile.
   - **Custom Health Check:** فعّله وضع المسار `http://<app>.back4app.io/api/categories` (يتأكد Back4App أن الخدمة حيّة قبل اعتماد النشر).
6. اضغط **Create App** وانتظر البناء (بضعة دقائق لصورة .NET). بعدها ستحصل على رابط مثل:
   `https://<app-name>.back4app.io`

> ⚠️ **محدودية free tier**: 256MB RAM قد تكون ضيقة على تطبيق .NET؛ إن ظهرت أخطاء **Out of Memory** عند البناء/التشغيل، جرّب الترقية لاحقًا أو قلّل استخدام الذاكرة (انظر استكشاف الأخطاء).

---

## المرحلة 4 — إبقاء الباكند مستيقظًا

Back4App Containers لا تُغفل الخدمة تلقائيًا مثل Render/Koyeb في الحالة العامة، لكن للتأكد من استمراريتها ومراقبة الحالة:

1. سجّل في **https://cron-job.org** (مجاني تمامًا).
2. أنشئ **Cronjob** جديد:
   - **Title:** `Keep 3ddz-api awake`
   - **URL:** `https://<app-name>.back4app.io/api/categories` ← نقطة ترجع `200` سريعًا.
   - **Schedule:** كل 10 دقائق (أو `*/10 * * * *`).
   - فعّل وأبقِه نشطًا.
3. تحقق من السجل: كل زيارة سترى `200 OK`.

---

## المرحلة 5 — نشر الفرونت على Cloudflare Pages (بدون بطاقة)

1. سجّل/ادخل إلى **https://dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. اختر الريبو `lprof7/3d-dz` → **Begin setup**.
3. الإعدادات:
   - **Framework preset:** `Vite`
   - **Build command:** `npm ci && npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend` (إن دعمت الواجهة؛ وإلا فاجعل الريبو الفرونت منفصلًا أو استخدم build config).
4. **Environment variables** — أضفها قبل أول بناء:
   - `VITE_API_BASE_URL` = `https://<app-name>.back4app.io` (بدون `/api` — الـ client يلحق `/api/...` تلقائيًا).
5. اضغط **Save and Deploy**. بعد البناء ستحصل على رابط:
   `https://<project>.pages.dev`

**إضافة `_redirects` لمسارات SPA** (لمنع 404 عند الدخول المباشر لمسار مثل `/product/xxx`):
- الملف موجود أصلًا: `frontend/public/_redirects` بمحتوى:
  ```
  /* /index.html 200
  ```
- Cloudflare Pages يقرأه تلقائيًا من مجلد النشر.

---

## المرحلة 6 — ربط الفرونت بالباكند (VITE_API_BASE_URL)

بعد اكتمال نشر الخدمتين، ستحصل على رابطين:
- الباكند: `https://<app-name>.back4app.io`
- الفرونت: `https://<project>.pages.dev`

الآن:
1. في Cloudflare Pages ← المشروع ← **Settings → Environment variables** ← تأكد من `VITE_API_BASE_URL` = `https://<app-name>.back4app.io`.
2. إذا غيّرته بعد أول بناء، أعد البناء (**Create new deployment**).
3. افتح رابط الفرونت وتأكد من:
   - ظهور المنتجات والصور الحقيقية.
   - عمل الفلاتر والبحث (تصل للباكند).
   - مسارات SPA المباشرة (`/product/xxx`) تعمل (بفضل `_redirects`).
   - إعدادات CORS: الباكند يستخدم `AllowAnyOrigin` — لا حاجة لتغيير.

---

## المرحلة 7 — التحقق الكامل (Check-list)

- [ ] `GET https://<app-name>.back4app.io/api/categories` → 200 JSON.
- [ ] `GET https://<app-name>.back4app.io/api/products` → قائمة المنتجات.
- [ ] تسجيل دخول admin → يعمل (`admin@3ddz.dz`).
- [ ] رفع صورة منتج من لوحة أدمن → يعمل عبر ImageKit (التحقق من `IMAGEKIT_PRIVATE_KEY`).
- [ ] مسارات SPA المباشرة (منع 404).
- [ ] ping الخدمة عبر cron-job.org نشط (آخر تنفيذ `200 OK`).
- [ ] نموذج 3D (GLB) يُعرض في صفحة المنتج / الصفحة الرئيسية.
- [ ] لم تُستخدم أي بطاقة ائتمانية في أي خطوة.

---

## استكشاف الأخطاء الشائعة

| العَرَض | السبب | الحل |
|---|---|---|
| فشل البناء: "no Dockerfile" | الـ Dockerfile غير موجود في root directory | تأكد أن Root Directory فارغ (`.`) والـ `Dockerfile` في الجذر |
| Health check failed | الخدمة لا تستجيب على المنفذ | تحقق أن الحاوية تستمع على `5199` وأن `PORT=5199`؛ راقب Running Logs |
| Out of Memory عند البناء/التشغيل | 256MB ضيقة على .NET | جرّب تحسين الذاكرة (أدناه) أو ارفع الخطة لاحقًا |
| الفرونت لا يجد البيانات (404/Network) | `VITE_API_BASE_URL` فارغ أو خاطئ | المرحلة 6؛ أعد البناء بعد التعديل |
| فشل رفع صورة في الأدمن | `IMAGEKIT_PRIVATE_KEY` غير مضبوطة | تحقق من القيمة في Back4App |
| `Application` ينهار عند أول تشغيل | `MONGODB_CONNECTION` غير صالح | تحقق من سلسلة الاتصال وأذونات الشبكة |

**لتقليل استخدام ذاكرة .NET داخل الـ Dockerfile** (إن صادفت OOM) — أضف إلى قسم build قبل `dotnet publish`:
```dockerfile
ENV DOTNET_gcServer=0
RUN dotnet publish ... -p:PublishTrimmed=false
```
ثم في قسم runtime:
```dockerfile
ENV DOTNET_gcServer=0
ENV ASPNETCORE_ENVIRONMENT=Production
```

---

## تحديثات مستقبلية (اختياري)

- **نطاق مخصص مجاني**: استخدم `*.back4app.io` / `*.pages.dev` كما هو الآن — بدون تكلفة.
- **ImageKit للـ GLB**: ارفع ملفات `.glb` عبر نفس آليات الرفع الموجودة (ستعمل تلقائيًا عبر `IMAGEKIT_*`).
- **ترقية**: عند الحاجة، ارفع بـ Back4App Shared Plan (~$5/شهر، 512MB) للمزيد من الـ RAM.
- **مرجع Render**: `render.yaml` ما زال موجودًا كمرجع — لكن إنشاء Web Service عليه يتطلب بطاقة حاليًا.

---

> **أمان**: `.env` معفى من GitHub. لا ترفع أبدًا `appsettings.Development.json` ولا أي ملف يحتوي مفاتيح/tokens إلى الريبو. عند استخدام GitHub MCP في opencode، ضع التوكن كمرجع `${GITHUB_TOKEN}` أو env var بدل نص صريح.