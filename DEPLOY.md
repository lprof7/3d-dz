# دليل نشر مشروع 3D DZ (الدليل الشامل)

نشر **مجاني تمامًا وبدون بطاقة ائتمانية** = **MongoDB Atlas (M0)** + **myASP.NET** (الباكند كـ ASP.NET Core على IIS/Windows) + **Netlify أو Cloudflare Pages** (الفرونت كـ Static).

> بنية الريبو: `backend/` (ASP.NET Core net10.0) + `frontend/` (React + Vite SPA) + ملفات النشر في الجذر: `Dockerfile` + `render.yaml` (مرجع فقط) + `scripts/publish-myasp.sh` (نشر myASP.NET المفحوص) + `scripts/build-myasp-zip.sh` (حزمة سورس لرفع ZIP).

> ⚠️ **لماذا لا Render ولا Koyeb؟** Render يطلب بطاقة للتحقق عند إنشاء أي Web Service (2025–2026). وKoyeb بعد استحواذ **Mistral** (فبراير 2026) لم يعد يقبل مستخدمين جدد إلا على خطط مدفوعة. والنقل الأخير: **myASP.NET** (استضافة Windows/IIS كلاسيكية، free trial 60 يوم بدون بطاقة، dعم .NET 10) — رابط ثابت لا يتغير، والبديل Fallback هو Back4App Containers.

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

- الباكند يستمع محليًا على `http://localhost:5199` (يُحدد عبر `launchSettings.json` — المنفذ لم يعد ملزمًا في الكود، انظر استكشاف الأخطاء).
- الفرونت يمرر `/api` عبر proxy إلى 5199.

---

## المرحلة 1 — MongoDB Atlas (الخيار M0 المجاني)

1. سجّل/ادخل إلى **https://www.mongodb.com/cloud/atlas**.
2. أنشئ **Cluster جديد** → اختر النوع **M0 Free** (Spark) → اختر مورد قريب منك (e.g. Frankfurt) → أنشئه.
3. أنشئ **Database User** (بيانات الاعتماد التي سُجّلت في `.env`):
   - Database Access → Add New Database User → authentication password.
   - امنحه أذونات **readWriteAnyDatabase** (أو على الأساس `3d-dz`).
4. فعّل **Network Access**:
   - → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) حتى يصل الخادم من أي عنوان (myASP.NET أو Back4App).
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

املأ ملف `.env` بكل القيم قبل بدء النشر (يستخدمها `scripts/publish-myasp.sh` تلقائيًا لحقنها في `web.config`):

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

## المرحلة 3 — نشر الباكند على myASP.NET (بدون بطاقة) — المُوصى به

**كيف تعمل الاستضافة (مهم للفهم):** myASP.NET استضافة **Windows/IIS** كلاسيكية (ليست حاويات). التطبيق يُنشر كـ **ASP.NET Core published folder** عبر FTP/Web Deploy، والاستضافة تشغّله خلف IIS عبر ASP.NET Core Module. لذلك بطل استخدام Docker، والمنفذ يُدار من IIS — الكود الآن يستخدم `app.Run()` دون ربط منفذ ثابت.

### 3.1 — سجّل التجربة المجانية
1. اذهب إلى **https://www.myasp.net/freeaspnethosting** → سجّل (بدون بطاقة).
2. فعّل **60-Day Trial** (لا يطلب وسيلة دفع إطلاقًا).
3. اختر **Datacenter** (US أو EU).
4. من لوحة التحكم بعد التسجيل ستحصل على:
   - **Temp URL** مثل `http://<username>-001-site1.myASP.NET` (رابط ثابت لا يتغير).
   - بيانات **FTP** (host/port/username/password).
   - بيانات **Web Deploy** (اختياري — سنستخدم FTP).

### 3.2 — أنشئ حزمة النشر (RAR الحالية: رفع ZIP يبني من السورس — انتبه!)

> ⚠️ **اكتشاف مهم (مُختبر):** خيار **Upload A Zip File** في myASP.NET **لا يرفع ناتجَ نشر جاهز** — بل يبني المشروع من **السورس** عبر **Railpack** والخطوات:
> 1) ينسخ **فقط** `*.csproj` من **جذر الأرشيف** → ينفّذ `dotnet restore`؛
> 2) ينسخ الشجرة كلها → ينفّذ `dotnet publish --no-restore -c Release -o out`؛
> 3) يشغّل `ASPNETCORE_URLS=http://0.0.0.0:${PORT:-3000} ./out/ThreeDDz.Api`.
>
> لذلك رفعُ `publish/myasp-deploy.zip` (ناتج `dotnet publish`) فشل بالرسالة:
> `Could not identify a project root (*.sln, *.csproj, package.json) ... Project is not based on dotnet or node. Terminated.`
>
> والأهم: مشروع الجذر الذي لديه `ProjectReference` لمشاريع شقيقة (مجلدات فرعية) **يفشل** أثناء الـ restore على الخادم — لأن الخطوة الأولى تنسخ csproj الجذر فقط، فتمرّ "Skipping project ... not found"، ثم يفشل الـ publish بـ `NETSDK1004` (لا يوجد `obj/project.assets.json` للمشاريع الشقيقة). الحل المطبّق في السكربت: **تسوية/دمج المشاريع الأربعة في مشروع واحد** (إزالة كل ProjectReference ودمج كل الحزم في csproj الجذر؛ المصادر تبقى in-folders يضمنها الـ SDK تلقائيًا).

**حزمة السورس** (الطريقة المُوصى بها) — من جذر الريبو:
```bash
bash scripts/build-myasp-zip.sh
```
- تجهّز نسخة **مسطّحة أحادية المشروع** في `publish/myasp-source` مع `ThreeDDz.Api.csproj` في الجذر وسطور `PackageReference` مدموجة من المشاريع الأربعة (تُلغي كل `ProjectReference`).
- **تتحقق من جمع الحزم**: تعمل `dotnet restore` محليًا لضمان صحة الدمج قبل الرفع.
- تُنشئ **`publish/myasp-source-deploy.zip`** (سورس فقط، بدون `bin/obj`).

**حزمة النشر الجاهزة (FTP فقط)** — من جذر الريبو:
```bash
bash scripts/publish-myasp.sh
```
- تُنفّذ `dotnet publish` (framework-dependent، net10.0، **OutOfProcess**) إلى `publish/myasp`.
- **تحقن تلقائيًا كل env vars من `.env`** داخل `<environmentVariables>` في `web.config` (تُستخدم فقط مع رفع FTP المباشر).
- تنشئ `publish/myasp-deploy.zip` (~3MB — **لا يصلح** لرفع ZIP الأوتوماتيكي كما فوق، بل لرفع FTP).

> ⚠️ **لماذا OutOfProcess؟** myASP.NET استضافة مشتركة (Shared) — كل المواقع تتشارك نفس الـ Application Pool، وتوثيقهم يطلب صراحةً `hostingModel="OutOfProcess"` لجميع تطبيقات ASP.NET Core. الخاصية مضافة الآن **دائمًا** في `ThreeDDz.Api.csproj`، فيتولّد `web.config` صحيح `OutOfProcess` لدى أي build/publish (سواءً محلي أو عن بُعد — تحقق: `grep hostingModel publish/myasp/web.config`).

### 3.3 — ارفع الملفات (الطريقة المُوصى بها: Upload A ZIP — من السورس)
1. من لوحة تحكم myASP.NET → الموقع/المنطقة المعنية → **Deployment → Upload A Zip File** (الحد 200MB):
   - ارفع **`publish/myasp-source-deploy.zip`** (جذره `ThreeDDz.Api.csproj` المشروع الواحد المدموج + كل المصادر مدموجة تحته).
2. سيبني الموقع من السورس تلقائيًا (اكتشاف `.NET`): `dotnet restore` (جذر واحد → لا Skipping) + `dotnet publish --no-restore` → ويعيد `web.config` بـ `OutOfProcess`.
3. انتظر انتهاء البناء (دقيقة-عدة دقائق) ثم افتح: `http://<temp-url>/api/categories`.

> **بعد الرفع مباشرة عالج المتغيرات (خطوة إجبارية):** البناء عن بُعد **لا** يحقن قيم `.env` في `web.config`. عيّنها يدويًا من لوحة التحكم:
> لوحة التحكم → **Advance** → **Pool Manager** → **Actions** → **Environment Variables**، وأضف (مفتاح + قيمة لكل واحد): `MONGODB_CONNECTION`، `MONGODB_DB=3d-dz`، `JWT_SECRET`، `JWT_ISSUER=3d-dz`، `JWT_AUDIENCE=3d-dz`، `IMAGEKIT_PUBLIC_KEY`، `IMAGEKIT_PRIVATE_KEY`، `IMAGEKIT_URL_ENDPOINT`. (لا `VITE_*`). ثم أعِد تجربة `/api/categories`.

> ملاحظة Git: مطابق أيضًا — إن اخترت **Git Repository** فسيحاول البناء من السورس ويحتاج الـ `.csproj` في جذر ما يستورده، مع متغيرات البيئة نفسها من Pool Manager. رفع الـ ZIP من السورس أسرع وأكثر تحكمًا.

> ملاحظة .NET: يجب أن تدعم خطة myASP.NET إصدار **.NET 10** — أكّد ذلك في خطة التجربة قبل الرفع (إن لم يكن متاحًا، غيّر `TargetFramework` في `ThreeDDz.Api.csproj` إلى `net9.0`/`net8.0` وأعد البناء).

### 3.4 — HTTPS (مهم إذا كان الفرونت HTTPS)
- Temp URL يأتي غالبًا عبر `http://`. الفرونت على Netlify/Cloudflare **HTTPS** → المتصفح يمنع الـ **Mixed Content** (طلب http من صفحة https).
- الحل: في لوحة myASP.NET فعّل **Let's Encrypt SSL / HTTPS** على الموقع (مدعوم مجانًا)، ثم استخدم `https://<temp-url>` في `VITE_API_BASE_URL`.
- إن لم يتوفر HTTPS مؤقتًا للـ temp URL، جرّب الفرونت محليًا للتجربة، أو استخدم Back4App (القسم البديل أدناه).

### 3.5 — بديل: رفع ناتج النشر الجاهز عبر FTP (إن أردت التحكم الكامل)
- `bash scripts/publish-myasp.sh` يبني `publish/myasp` (ناتج `dotnet publish` **مع** `web.config` محقون فيه كل env vars من `.env`).
- ارفع **محتويات** `publish/myasp` إلى **جذر الموقع** عبر FileZilla (وضع **Passive**) أو Web Deploy — لا ترفع المجلد نفسه.
- ثم أعد انبعاث الموقع / App Pool من لوحة التحكم وافتح `/api/categories`.

---

## المرحلة 3ب (بديل) — نشر الباكند على Back4App Containers (بدون بطاقة)

> **يعتبر fallback**: Back4App free يعطي **Temporary/Rotating URL** في بعض الحالات (يحذّرك: "URL is temporary and will be live for 60 minutes") — يعني الرابط يتغير/ينتهي عند الخمول وإعادة الإحياء، وهذا سبب المشكلة الأصلية. استخدمه فقط إذا لم ينجح HTTPS على myASP.NET.

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

## المرحلة 4 — إبقاء الباكند مستيقظًا (Back4App فقط)

Back4App Containers free قد يضع التطبيق في idle/rotating URL. إن كنت على **myASP.NET** لا تحتاج هذا (استضافة IIS ثابتة). إن عدتَ لوضع Back4App:

1. سجّل في **https://cron-job.org** (مجاني تمامًا).
2. أنشئ **Cronjob** جديد:
   - **Title:** `Keep 3ddz-api awake`
   - **URL:** `https://<app-name>.back4app.io/api/categories` ← نقطة ترجع `200` سريعًا.
   - **Schedule:** كل 10 دقائق (أو `*/10 * * * *`).
   - فعّل وأبقِه نشطًا.
3. تحقق من السجل: كل زيارة سترى `200 OK`.

---

## المرحلة 5 — نشر الفرونت على Netlify (بدون بطاقة)

**إعداد البناء** (المتطلبات موجودة، فالواجهة تقفل Base/Publish directory):
- الملف `netlify.toml` في جذر الريبو (له الأولوية على إعدادات الواجهة):
  ```toml
  [build]
    command = "npm ci && npm run build"
    publish = "dist"

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- في Netlify → **Deploys** → ربط ريبو GitHub `lprof7/3d-dz` (أو ارفع مجلد `frontend/dist` يدويًا عبر **Netlify Drop**).
- **Environment variables** — أضفها قبل البناء:
  - `VITE_API_BASE_URL` = رابط الباكند (بدون `/api` — الـ client يلحق `/api/...` تلقائيًا). مثال myASP.NET: `https://<temp-url>` أو `https://<app>.back4app.io`.
- بعد البناء ستحصل على رابط: `https://<site-name>.netlify.app`

**إضافة `_redirects` لمسارات SPA** (لمنع 404 عند الدخول المباشر لمسار مثل `/product/xxx`):
- الملف موجود أصلًا: `frontend/public/_redirects` بمحتوى:
  ```
  /* /index.html 200
  ```

---

## المرحلة 6 — ربط الفرونت بالباكند (VITE_API_BASE_URL)

بعد اكتمال نشر الخدمتين، ستحصل على رابطين:
- الباكند: `https://<temp-url>` (myASP.NET) أو `https://<app-name>.back4app.io`
- الفرونت: `https://<site-name>.netlify.app`

الآن:
1. في Netlify ← المشروع ← **Site configuration → Environment variables** ← تأكد من `VITE_API_BASE_URL` = رابط الباكند **مع HTTPS**.
2. إذا غيّرته بعد أول بناء، أعد البناء (**Deploys → Deploy site / Clear cache and deploy**).
3. افتح رابط الفرونت وتأكد من:
   - ظهور المنتجات والصور الحقيقية.
   - عمل الفلاتر والبحث (تصل للباكند).
   - مسارات SPA المباشرة (`/product/xxx`) تعمل (بفضل `_redirects`).
   - إعدادات CORS: الباكند يستخدم `AllowAnyOrigin` — لا حاجة لتغيير.

---

## المرحلة 7 — التحقق الكامل (Check-list)

- [ ] `GET https://<temp-url>/api/categories` → 200 JSON (myASP.NET).
- [ ] `GET https://<temp-url>/api/products` → قائمة المنتجات.
- [ ] تسجيل دخول admin → يعمل (`admin@3ddz.dz`).
- [ ] رفع صورة منتج من لوحة أدمن → يعمل عبر ImageKit (التحقق من `IMAGEKIT_PRIVATE_KEY`).
- [ ] مسارات SPA المباشرة (منع 404).
- [ ] (Back4App فقط) ping الخدمة عبر cron-job.org نشط.
- [ ] نموذج 3D (GLB) يُعرض في صفحة المنتج / الصفحة الرئيسية.
- [ ] لم تُستخدم أي بطاقة ائتمانية في أي خطوة.

---

## استكشاف الأخطاء الشائعة

| العَرَض | السبب | الحل |
|---|---|---|
| myASP.NET يعطي صفحة خطأ IIS/HTTP 500 | التطبيق لم يبدأ تحت IIS | فعّل `stdoutLogEnabled="true"` في `web.config` وأعد الرفع؛ ثم راجع `publish/myasp/logs/` |
| `.NET` لا يُشغَّل (421/404) | إصدار .NET غير مدعوم على الخطة | تأكد أن الخطة تدعم .NET 10؛ وإلا غيّر `TargetFramework` إلى `net9.0`/`net8.0` |
| بلد build "Skipping project ... not found" ثم `NETSDK1004` | مشروع الجذر فيه `ProjectReference` لمشاريع مجلدات فرعية (Railpack ينسخ csproj الجذر فقط قبل restore) | أعد الحزمة عبر `bash scripts/build-myasp-zip.sh` (يدمجها في مشروع واحد) |
| `Upload` يفشل: "Could not identify a project root (*.sln, *.csproj, package.json)" | رُفع ناتج publish جاهز بدل السورس | ارفع `publish/myasp-source-deploy.zip` (جذره csproj) لا `myasp-deploy.zip` |
| myASP.NET: HTTP 500 عند التشغيل على shared hosting | استخدام `hostingModel="inprocess"` | `ThreeDDz.Api.csproj` يفرض **OutOfProcess** الآن؛ أعد رفع `publish/myasp-source-deploy.zip` (يبني من السورس) |
| 502.3 — Bad Gateway / المنفذ | الكود يربط منفذًا ثابتًا | تأكد أن `Program.cs` يستخدم `app.Run()` بدون منفذ (تم إصلاحه) |
| Mixed Content (طلب http من فرونت https) | `VITE_API_BASE_URL` يستخدم http والفرونت https | فعّل Let's Encrypt SSL في لوحة myASP.NET واستخدم `https://` |
| FTP يرفض الاتصال | معلومات FTP خاطئة/المنفذ النشط غير مدعوم | استخدم وضع **Passive** في FileZilla وتأكد من host/port/username من لوحة التحكم |
| الفرونت لا يجد البيانات (404/Network) | `VITE_API_BASE_URL` فارغ أو خاطئ | المرحلة 6؛ أعد البناء بعد التعديل |
| فشل رفع صورة في الأدمن | `IMAGEKIT_PRIVATE_KEY` غير مضبوطة | أعد ضبطه في **Pool Manager → Environment Variables** (أو أعد رفع الحزمة بعد تصحيح `.env` للسورس) |
| `Application` ينهار عند أول تشغيل | `MONGODB_CONNECTION` غير صالح | تحقق من سلسلة الاتصال وأذونات الشبكة (myASP يجب أن يصل لـ Atlas عبر 0.0.0.0/0) |
| (Back4App فقط) فشل البناء: "no Dockerfile" | الـ Dockerfile غير موجود في root directory | تأكد أن Root Directory فارغ (`.`) والـ `Dockerfile` في الجذر |
| (Back4App فقط) Health check failed | الخدمة لا تستجيب على المنفذ | تحقق أن الحاوية تستمع على `5199` وأن `PORT=5199`؛ راقب Running Logs |
| (Back4App فقط) Out of Memory | 256MB ضيقة على .NET | جرّب تحسين الذاكرة (أدناه) أو ارفع الخطة لاحقًا |
| Back4App: "URL is temporary ... 60 minutes" | الرابط المؤقت المتغيّر في free tier | انتقل إلى myASP.NET (مسار النشر الأساسي) أو فعّل HTTPS عليه |

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

- **نطاق مخصص**: myASP.NET يدعم نطاقك الخاص + Let's Encrypt مجانًا؛ وبعد 60 يومًا إما يرتفع الخدمة أو تنتقل (متغيّر وفق التجربة).
- **ImageKit للـ GLB**: ارفع ملفات `.glb` عبر نفس آليات الرفع الموجودة (ستعمل تلقائيًا عبر `IMAGEKIT_*`).
- **تحديثات لاحقة**: أعد `bash scripts/build-myasp-zip.sh` وأعد رفع `publish/myasp-source-deploy.zip` عبر **Upload A Zip** (أو انشر `publish/myasp` عبر FTP مع `scripts/publish-myasp.sh`).
- **مرجع Render**: `render.yaml` ما زال موجودًا كمرجع — لكن إنشاء Web Service عليه يتطلب بطاقة حاليًا.

---

> **أمان**: `.env` معفى من GitHub. لا ترفع أبدًا `appsettings.Development.json` ولا أي ملف يحتوي مفاتيح/tokens إلى الريبو. عند استخدام GitHub MCP في opencode، ضع التوكن كمرجع `${GITHUB_TOKEN}` أو env var بدل نص صريح.