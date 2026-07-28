# تحليل عميق لمشروع 3D DZ — كشف الأخطاء والأشياء غير المكتملة

> هذا الملف هو السجل المرجعي لكل حالات الاستخدام في المشروع. تم تحليل كل حالة بعمق شديد، مع توثيق جميع الملفات المتعلقة بها (Frontend / Backend / Database) وكل الأخطاء أو الأشياء الناقصة أو المنحرفة عن المتطلبات (`prompt.md` / `reauirments.md` / `flow.md`).
>
> **مفتال الخطورة:** 🔴 حرج / عالي | 🟠 متوسط | 🟡 منخفض / تحسين
>
> **تاريخ التحليل:** 2026-07-18

---

## 0. التحليل المعماري الشامل للمشروع (Project Deep Analysis)

### 0.1 نظرة عامة على المشروع
مشروع **3D DZ** هو سوق رقمي لملفات الطباعة ثلاثية الأبعاد بمالك واحد (على غرار Cults3D لكن غير متعدد البائعين). لا توجد بوابة دفع — الزبون يقدم طلبًا يدويًا (الاسم، الهاتف، البريد، الولاية) ويتم التعامل معه خارج المنصة.

**التقنيات المعتمدة:**
- Backend: ASP.NET Core .NET 10 (Clean Architecture: Domain / Application / Infrastructure / Api)
- Database: MongoDB Atlas
- File storage: ImageKit
- Auth: JWT (BCrypt)
- Frontend: React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + Zustand + i18next + React Router v7

### 0.2 الإحصائيات العامة للكود
- **Backend (.cs files):** ~23 ملف كود فعلي (بدون obj/bin) — أكبر ملف `SeedData.cs` (325 سطر)
- **Frontend (.tsx/.ts files):** ~23 ملف — أكبر ملف `AdminDashboard.tsx` (950 سطر) — **ملف عملاق يحتاج تقسيم**
- **Tests:** صفر (مجلد `backend/tests/` فارغ، لا توجد اختبارات واجهة أيضًا) 🔴

### 0.3 القضايا المعمارية والأمنية الشاملة (Cross-cutting)

| # | القضية | الخطورة | الموقع | الوصف |
|---|---|---|---|---|
| G1 | 🔴 **تسريب بيانات اعتماد GitHub PAT و Stitch API key** | حرج | `opencode.json` | الملف مُتتبَّع في git (أكد `git ls-files`) ويحتوي على `github_pat_...` و `X-Goog-Api-Key` كنص صريح. يجب إزالته من git والتاريخ فورًا وتدوير المفاتيح. |
| G2 | 🔴 **تسريب مفاتيح ImageKit الحقيقية** | حرج | `backend/src/ThreeDDz.Api/appsettings.Development.json` | الملف في .gitignore (جيد) لكنه موجود محليًا بمفاتيح حقيقية (`public_oujfJ9...` / `private_rPZOq...`). يجب التأكد من عدم رفعها لأي مستودع وتدويرها. |
| G3 | 🔴 **عدم وجود اختبارات إطلاقًا** | حرج | `backend/tests/` (فارغ)، لا frontend tests | `progress.md` يزعم الاكتمال لكن لا يوجد أي اختبار وحدة/تكامل/E2E. مخالفة صريحة لمبدأ "verify with tests". |
| G4 | 🟠 **انحراف عن هيكل مجلدات prompt.md (Frontend)** | متوسط | `frontend/src/presentation/features/*/pages/` و `components/` | prompt.md (القسم 3) يلزم بوجود `pages/` و `components/` لكل feature. المجلدات موجودة لكنها **فارغة بالكامل**. كل الكود في ملف واحد لكل feature (مخالفة + ملفات عملاقة). |
| G5 | 🟠 **انحراف عن هيكل طبقات prompt.md (Backend)** | متوسط | `backend/src/ThreeDDz.Application/Services/` (فارغ) و `Domain/DTOs/` (فارغ) | prompt.md يحدد طبقة Services في Application layer و DTOs في Domain. الخدمات موجودة فعليًا في `Infrastructure/Services` ولا توجد DTOs منفصلة (تُستخدم الـ Models مباشرة). انحراف عن Clean Architecture المطلوبة. |
| G6 | 🔴 **ملف إعداد الهوية المفرد (theme.config.ts) مفقود** | حرج | `frontend/src/core/theme/` (فارغ) | prompt.md القسم 5 يلزم بملف واحد `src/core/theme/theme.config.ts` يصدّر كل brand tokens. بدلًا من ذلك، الـ tokens مبثوثة في `index.css` كـ Tailwind `@theme`. هذا يخالف متطلب "ملف إعداد واحد" القابل للتغيير من مكان واحد دون لمس الكومبوننتس. |
| G7 | 🟠 **مجلد data/entity مزدوج وغير منظم (Frontend)** | متوسط | `frontend/src/data/` | prompt.md يلزم بـ `data/<entity>/<entity>.repository.ts` و `<entity>.types.ts`. المجلدات الكيانية (products, orders, ...) **فارغة**، والـ repos الفعلية في `data/repos/`، والأنواع في `data/types/index.ts` واحد مزدحم. مخالفة هيكلية. |
| G8 | 🟠 **تناقض في بورت الـ API** | متوسط | `Program.cs:95` (5199) مقابل `REPORT.md` (5000) | الـ Backend يعمل على 5199، والـ Vite proxy يشير إلى 5199 (متسق)، لكن `REPORT.md` يذكر 5000. توثيق مضلل. |
| G9 | 🟡 **OpenApi/Swagger معطل** | منخفض | `Program.cs:73-88` | تعليق "OpenApi disabled due to .NET 10 preview compatibility". لا توجد وثائق API تفاعلية، رغم أن `REPORT.md` يوثق endpoints يدويًا. |
| G10 | 🟠 **تخزين JWT في localStorage** | متوسط | `core/api/client.ts`، `core/auth/store.ts` | `flow.md` (US-B2) يلزم بتخزين آمن (HttpOnly cookie أو Secure storage). localStorage عرضة لهجمات XSS. مخالفة أمنية. |
| G11 | 🟠 **CORS مفتوح بالكامل (AllowAnyOrigin)** | متوسط | `Program.cs:76` | في الإنتاج يجب تقييد الأصول. مقبول للديف لكن يجب التأشير في REPORT. |
| G12 | 🟡 **مجلد `docs/` فارغ** | منخفض | `docs/` | لا توجد وثائق تقنية إضافية. |
| G13 | 🟠 **عدم وجود CSRF protection** | متوسط | Backend | رغم JWT، لا حماية CSRF إن استُخدمت cookies لاحقًا. |
| G14 | 🟡 **عدم وجود Rate Limiting** | منخفض | Backend | لا حماية ضد brute-force على endpoints المصادقة (login/register/forgot). |
| G15 | 🟠 **الرسوم تعتمد على `dir="auto"` بدل RTL صريح** | متوسط | `App.tsx:38` | `dir="auto"` يجعل الاتجاه يعتمد على المحتوى، لكن prompt.md يلزم بـ RTL عند العربية و LTR افتراضيًا. `App.tsx:61` يضبط `dir` لكن الـ Layout يستخدم `auto` — تناقض. |
| G16 | 🟠 **`search` feature بدون route** | متوسط | `App.tsx` | مجلد `presentation/features/search/` موجود لكن لا route له في App.tsx (البحث ربما داخل Catalog). ملفات الـ search تبدو غير مستخدمة. |
| G17 | 🟡 **خطأ في CORS policy: لا تقييد methods/headers** | منخفض | `Program.cs:76` | `AllowAnyMethod().AllowAnyHeader()` — مقبول ديف لكن يجب تقييده إنتاجًا. |

---

## 1. فهرس حالات الاستخدام (Use Case Catalog)

> المصدر: `reauirments.md` (Epics A–I) + `flow.md` (التدفقات التفصيلية). المجموع: **28 حالة استخدام** موزعة على 9 Epics.

| Epic | رمز حالة الاستخدام | العنوان | أولوية التحليل |
|---|---|---|---|
| 🔵 A — تصفح المنتجات | US-A1 | الصفحة الرئيسية | عالية |
| 🔵 A | US-A2 | تصفح حسب الفئات والمجموعات | عالية |
| 🔵 A | US-A3 | صفحة تفاصيل المنتج | عالية |
| 🔵 A | US-A4 | البحث والفلترة | عالية |
| 🟢 B — حساب المستخدم | US-B1 | إنشاء حساب | عالية |
| 🟢 B | US-B2 | تسجيل الدخول والخروج | عالية |
| 🟢 B | US-B3 | تعديل الملف الشخصي | عالية |
| 🟢 B | US-B4 | استعادة كلمة المرور | عالية |
| 🟡 C — المفضلة والسلة | US-C1 | إضافة إلى المفضلة | عالية |
| 🟡 C | US-C2 | إضافة إلى السلة | عالية |
| 🟠 D — الطلبات | US-D1 | تقديم طلب | حرجة |
| 🟠 D | US-D2 | رسالة تأكيد الطلب | عالية |
| 🟠 D | US-D3 | متابعة سجل الطلبات | عالية |
| 🟠 D | US-D4 | تواصل الأدمين لتأكيد الطلب | متوسطة |
| 🟣 E — التقييمات | US-E1 | كتابة تقييم | عالية |
| 🟣 E | US-E2 | عرض التقييمات المعتمدة | عالية |
| 🔴 F — إدارة المنتجات | US-F1 | رفع منتج جديد | حرجة |
| 🔴 F | US-F2 | تعديل/حذف منتج | حرجة |
| 🔴 F | US-F3 | تنظيم الفئات والمجموعات | عالية |
| 🔴 F | US-F4 | إدارة المحتوى المميز والبانرات | عالية |
| 🔴 F | US-F5 | التسعير والعروض | عالية |
| 🟤 G — إدارة الطلبات | US-G1 | قائمة كل الطلبات | حرجة |
| 🟤 G | US-G2 | تفاصيل طلب | عالية |
| 🟤 G | US-G3 | تغيير حالة الطلب | حرجة |
| 🟤 G | US-G4 | ملاحظات داخلية | عالية |
| 🟤 G | US-G5 | إشعار طلب جديد | عالية |
| 🟤 G | US-G6 | بحث وفلترة الطلبات | عالية |
| ⚫ H — الزبائن والتقييمات | US-H1 | قائمة الزبائن | عالية |
| ⚫ H | US-H2 | حظر/تفعيل حساب | عالية |
| ⚫ H | US-H3 | مراجعة التقييمات | عالية |
| ⚪ I — التحليلات | US-I1 | الإحصائيات العامة | عالية |

---

## 2. خريطة الملفات الرئيسية (File Map)

### 2.1 Backend
- **Domain/Models:** `Banner.cs`, `Category.cs`, `Collection.cs`, `FavoriteAndCart.cs`, `LocalizedString.cs`(+Converter), `Order.cs`, `Product.cs`, `Review.cs`, `User.cs`, `Wilaya.cs`
- **Domain/Enums:** `Enums.cs`
- **Application/Interfaces:** `IRepository.cs`, `IEntityRepositories.cs`, `IServices.cs`
- **Infrastructure/Repositories:** `MongoContext.cs`, `MongoRepository.cs`, `CommonRepositories.cs`, `ProductRepository.cs`, `OrderReviewFavoriteRepos.cs`
- **Infrastructure/Services:** `AuthService.cs`, `ProductService.cs`, `CategoryService.cs`, `OrderService.cs`, `ReviewService.cs`, `CartFavoriteService.cs`, `AnalyticsService.cs`, `ImageKitService.cs`, `TranslationService.cs`, `JwtService.cs`, `NotificationService.cs`, `MiscServices.cs`
- **Api/Controllers:** `AuthController.cs`, `ProductsController.cs`, `CategoriesCollectionsBannersController.cs`, `CartOrdersFavoritesController.cs`, `AdminReviewsController.cs`, `UploadController.cs`
- **Api:** `Program.cs`, `Seed/SeedData.cs`, `Validators/RequestValidators.cs`

### 2.2 Frontend
- **core:** `api/client.ts`, `auth/store.ts`, `store/cart.ts`, `i18n/i18n.ts`+`localized.ts`+`locales/{ar,fr,en}.json`
- **data:** `repos/{productRepo,categoryRepo,orderRepo,adminRepo}.ts`, `types/index.ts`
- **presentation/features:** `home/Home.tsx`, `catalog/Catalog.tsx`, `product/ProductDetail.tsx`, `cart/Cart.tsx`, `checkout/Checkout.tsx`, `auth/Auth.tsx`, `account/Account.tsx`, `admin/AdminDashboard.tsx`
- **presentation/shared:** `layout/Layout.tsx`, `ProductCard.tsx`, `NotFound.tsx`
- **root:** `App.tsx`, `main.tsx`, `index.css`

### 2.3 Database (MongoDB Collections — مستنتجة من Seed/Models)
`users`, `products`, `categories`, `collections`, `banners`, `reviews`, `orders`, `carts`, `favorites`, `wilayas`

---

> **ملاحظة:** الأقسام التالية (3 → 11) ستحتوي التحليل التفصيلي لكل Epic وحالات استخدامه، مع توثيق: الملفات المرتبطة، التدفق المتوقع (من flow.md)، التحقق من التنفيذ، وكل الأخطاء/النواقص بمرجع الملف والسطر.

---

## 3. 🔵 Epic A — تصفح المنتجات

### 3.1 US-A1 — الصفحة الرئيسية

**الملفات المرتبطة:**
- Frontend: `presentation/features/home/Home.tsx` (123 سطر)، `presentation/shared/layout/Layout.tsx`، `presentation/shared/ProductCard.tsx`
- Frontend data: `data/repos/productRepo.ts` (getFeatured/getNewest)، `data/repos/orderRepo.ts` (bannerRepo — استيراد من ملف غير منطقي)
- Backend: `ProductsController.cs` (Featured/Newest endpoints)، `CategoriesCollectionsBannersController.cs` (BannersController.GetActive)
- Backend services: `ProductService.cs`، `MiscServices.cs` (BannerService.GetActiveAsync)
- Backend repos: `ProductRepository.cs` (GetFeaturedAsync/GetNewestAsync)، `CommonRepositories.cs` (BannerRepository.GetActiveAsync)
- DB: `banners`, `products`, `categories` collections

**التدفق المتوقع (flow.md US-A1):**
1. فتح الصفحة الرئيسية
2. النظام يجلب: منتجات مميزة، بانرات نشطة، فئات، آخر المنتجات
3. عرض: Hero Banner، شريط فئات، Carousel مميز، قسم "الأحدث"
4. الضغط على عنصر يوجه لصفحته
- **بديل 1:** لا توجد منتجات مميزة → إخفاء قسم Featured وعرض "الأحدث" فقط
- **بديل 2:** فشل تحميل البيانات → رسالة خطأ ودّية + زر "إعادة المحاولة"

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| A1-1 | 🔴 | `Home.tsx:23-33` | **عدم وجود معالجة أخطاء (catch)** في `Promise.all`. أي فشل في أي طلب سيؤدي إلى `unhandled promise rejection` وبقاء شاشة التحميل للأبد (loading لا يُضبط false إلا في `.finally` — هذا الجزء صحيح، لكن لا رسالة خطأ ولا زر إعادة محاولة). مخالفة لبديل 2. |
| A1-2 | 🔴 | `Home.tsx:82-91` | **بديل 1 غير منفذ:** قسم Featured يُعرض دائمًا حتى لو فارغ. flow.md يلزم بإخفائه إن لم توجد منتجات مميزة. |
| A1-3 | 🟠 | `Home.tsx:6` | **استيراد سيء التنظيم:** `bannerRepo` يُستورد من `data/repos/orderRepo.ts` بدلاً من ملف مستقل. مخالفة هيكل prompt.md (entity per file). نفس المشكلة في `ProductCard.tsx:7` و`ProductDetail.tsx:5` (`reviewRepo, favoriteRepo` من orderRepo). |
| A1-4 | 🔴 | `SeedData.cs:171` | **رابط بانر خاطئ:** البانر الـ seeded له `LinkUrl = "/explore"`، لكن الـ route في `App.tsx:70` هو `/catalog` وليس `/explore`. الضغط على البانر سيوجه لصفحة 404. |
| A1-5 | 🟠 | `Home.tsx:75-77` | **زر "Upload Model" غير وظيفي:** زر `<button>` بلا `onClick`. في نموذج مالك واحد، هذا الزر يجب أن يوجه للأدمن فقط أو يُخفى عن الزوار/الزبائن. حاليًا زر ميت. |
| A1-6 | 🟡 | `Home.tsx:86,113` | **روابط "viewAll":** تستخدم `/catalog?featured=true` لكن الـ Catalog لا يقرأ بارامتر `featured` (راجع Catalog.tsx — لا يوجد معالجة له). الرابط لن يفلتر. |
| A1-7 | 🟠 | `Home.tsx:50-57` | **معالجة الـ fallback للهيرو ضعيفة:** عند وجود بانر، يُطبَّق gradient شفاف، لكن عند فقده يُستخدم gradient ثابت بألوان `#862200` و`#00363e` — هذه قيم مختلفة عن DESIGN.md (primary-container هو `#ff6a3d` لا `#862200` الذي هو on-primary-fixed-variant). انحراف عن الهوية البصرية. |
| A1-8 | 🟡 | `Home.tsx:42` | **شاشة التحميل تستخدم `min-h-screen`** بينما الـ Header ثابت (fixed) بارتفاع 64px، مما يعني أن شاشة التحميل ستختفي خلف الـ Header. يجب استخدام `pt-16` أو padding مماثل. |
| A1-9 | 🟡 | `Home.tsx:69-70` | **تبديل الـ banner لا يدعم RTL:** النقاط في `bottom-6 left-1/2` لكن في RTL قد تحتاج تعديل. أيضًا المؤشر `paused` على `mouseEnter/Leave` لكن لا دعم للموبايل (no touch swipe). |
| A1-10 | 🟠 | `Home.tsx:34` | **useEffect بدون مصفوفة اعتماد صحيحة:** الـ effect يعتمد على `[]` لكنه يستدعي دوال مستقرة — مقبول، لكن `Promise.all` لا يُلغى عند unmount (قد يسبب setState on unmounted component). يجب `AbortController` أو راية `isMounted`. |
| A1-11 | 🟡 | `Home.tsx:96` | **شبكة الفئات `grid-cols-2 md:grid-cols-5`:** مع 10 فئات ستعطي صفين على الديسكتوب، لكن flow.md يتحدث عن "شريط فئات" (carousel/strip) وليس grid ثابت. انحراف بسيط عن التصميم. |
| A1-12 | 🟡 | `Home.tsx:99-100` | **لون الخلفية مُشفّر (hardcoded):** `style={{ backgroundColor: '#1e1f25' }}` بدلاً من استخدام token (surface-container). مخالفة لقاعدة prompt.md القسم 5 "never hardcode a hex color". يكرر في عدة أماكن (Home.tsx:100، ProductCard.tsx:24، ProductDetail.tsx:142,272، Catalog.tsx). |
| A1-13 | 🟡 | `BannerRepository.cs:43` | **مع `EndAt` null:** البانر بدون تاريخ نهاية يبقى نشطًا دائمًا (مطابق لـ flow.md US-F4 بديل) ✅ لكن لا يوجد منطق لإلغاء التنشيط التلقائي بعد انتهاء العرض — يعتمد على الاستعلام. مقبول لكن غير موثّق. |

---

### 3.2 US-A2 — تصفح حسب الفئات والمجموعات

**الملفات المرتبطة:**
- Frontend: `presentation/features/catalog/Catalog.tsx` (284 سطر)
- Frontend data: `data/repos/productRepo.ts` (getByCategory/getByCollection)، `data/repos/categoryRepo.ts` (collectionRepo)
- Backend: `ProductsController.cs` (Search)، `CategoriesCollectionsBannersController.cs` (Collections.GetProducts)
- Backend services: `ProductService.cs`، `CategoryService.cs`، `CollectionService.cs`
- DB: `products`, `categories`, `collections`

**التدفق المتوقع (flow.md US-A2):**
1. الضغط على فئة
2. توجيه لـ `/category/{slug}` أو `/collection/{slug}`
3. جلب اسم الفئة (باللغة الحالية) + قائمة منتجاتها (Paginated، 20/صفحة)
4. عرض شبكة مع: صورة مصغرة، الاسم، السعر، متوسط التقييم
5. Pagination + فلاتر
- **بديل 1:** فئة بلا منتجات → Empty State + رسالة + رسمة 3D
- **بديل 2:** Slug غير موجود → 404 مخصص بنفس الهوية

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| A2-1 | 🔴 | `Catalog.tsx:25`، `App.tsx:71-72` | **ازدواجية مسارات الفئات:** الـ routes هي `/category/:slug` و`/collection/:slug`، لكن الروابط في Home.tsx:98 وLayout.tsx:60-61 تستخدم `/catalog?category=slug`. هذا يعني مسارين مختلفين لنفس الوظيفة. flow.md يحدد `/category/{slug}`. يجب توحيد. |
| A2-2 | 🔴 | `Catalog.tsx:184-190` | **بديل 1 (Empty State) ناقص:** flow.md يلزم برسالة "لا توجد منتجات حاليًا في هذه الفئة" + رسمة 3D. الحالي يعرض `t('common.notFound')` (نص عام) + زر "All". لا رسمة 3D، ولا نص مخصص. |
| A2-3 | 🔴 | `App.tsx:80`، `Catalog.tsx` | **بديل 2 (404 مخصص للـ slug الخاطئ):** غير منفذ. عند زيارة `/category/slug-غير-موجود`، الـ Catalog يعرض فقط Empty State، لا صفحة 404. كذلك `NotFound.tsx` (15 سطر) بسيط ولا يعكس "نفس الهوية البصرية" المطلوبة. |
| A2-4 | 🟠 | `Catalog.tsx:39-74` | **منطق حل الـ slug هش:** `if (categorySlug && !resolvedCategoryId && categories.length === 0) return;` يرجع دون ضبط loading=false، مما يبقي شاشة التحميل. كما أن الاعتماد على `categories.length === 0` للـ skip يعني أنه عند عدم تحميل الفئات، لا يحدث شيء. |
| A2-5 | 🟠 | `Catalog.tsx:47-56` | **منتجات المجموعة لا تدعم Pagination:** تستدعي `getByCollection(col.id)` الذي يستدعي backend `GetProducts(id)` ← `GetByCollectionAsync(collectionId, 0, 100)`. hardcode 100 كحد. flow.md يلزم بـ pagination (20/صفحة). |
| A2-6 | 🔴 | `Catalog.tsx:74` | **useEffect بمصفوفة اعتماد ضخمة ومتغيرة:** `[categorySlug, collectionSlug, sort, search, minPrice, maxPrice, minRating, page, categories, collections]`. `categories` و`collections` مصفوفات جديدة في كل render (مصفوفات state تُستبدل)، مما يسبب حلقات إعادة تنفيذ غير ضرورية وطلبات متكررة. |
| A2-7 | 🟠 | `Catalog.tsx:165-178` | **عدم عرض اسم الفئة/المجموعة الحالية:** flow.md خطوة 3 يلزم بجلب وعرض اسم الفئة باللغة الحالية. الـ Catalog يعرض دائمًا `t('nav.explore')` (عنوان عام) بدلاً من اسم الفئة. |
| A2-8 | 🟡 | `Catalog.tsx:22` | **priceBounds ثابت (hardcoded):** `min: 0, max: 100000` بلا جلب من الـ backend. قد لا يطابق الأسعار الفعلية. |
| A2-9 | 🟡 | `Catalog.tsx:174-176` | **نصوص خيارات الترتيب غير مترجمة:** "Price: Low → High"، "Price: High → Low"، "Rating: High → Low" — نصوص إنجليزية مُشفّرة. مخالفة i18n (prompt.md القسم 6). |
| A2-10 | 🟠 | `ProductsController.cs:24` | **pageSize افتراضي 20** في الـ backend، لكن `Catalog.tsx:62` يرسل `pageSize: 12`. عدم تطابق قد يربك الـ API إذا اعتُمد على الافتراضي. |
| A2-11 | 🟡 | `Catalog.tsx:205-213` | **عرض كل صفحات الـ pagination:** `Array.from({length: totalPages})` يعرض كل الأرقام. مع 100 صفحة ستكون كارثة UX. لا يوجد truncation (1, 2, ..., 50, 51). |
| A2-12 | 🟡 | `Catalog.tsx:24` | **isCollection يُحسب من `location.pathname.startsWith('/collection')`** بدلاً من route param — هش ويعتمد على بنية الـ URL. |

---

### 3.3 US-A3 — صفحة تفاصيل المنتج

**الملفات المرتبطة:**
- Frontend: `presentation/features/product/ProductDetail.tsx` (379 سطر)
- Frontend data: `data/repos/productRepo.ts` (getBySlug/getRelated)، `data/repos/orderRepo.ts` (reviewRepo/favoriteRepo)
- Backend: `ProductsController.cs` (GetBySlug)
- Backend services: `ProductService.cs` (GetBySlugAsync/GetRelatedAsync)
- DB: `products`, `reviews`, `favorites`

**التدفق المتوقع (flow.md US-A3):**
1. الضغط على منتج → `/product/{slug}`
2. جلب: معرض الصور، الاسم/الوصف (باللغة الحالية)، السعر، معلومات الترخيص، متوسط التقييم وعدد المراجعات، حالة التوفر
3. عرض أزرار: "إضافة للسلة"، "إضافة للمفضلة" (تتطلب تسجيل دخول)، تبويبات (الوصف/الترخيص/التقييمات)
4. قسم "منتجات ذات صلة" (نفس الفئة)
- **بديل 1:** غير مسجل ويضغط مفضلة → توجيه لتسجيل الدخول + رسالة
- **بديل 2:** المنتج غير منشور/محذوف → 404
- **بديل 3:** لا تقييمات بعد → "كن أول من يقيّم" (للمؤهلين فقط)

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| A3-1 | 🔴 | `ProductDetail.tsx` | **التبويبات (Tabs) غير منفذة:** flow.md خطوة 4 يلزم بتبويبات (الوصف الكامل / الترخيص / التقييمات). الكود يعرض كل الأقسام مكدسة عموديًا بلا تبويبات. مخالفة صريحة. |
| A3-2 | 🔴 | `ProductDetail.tsx` | **حالة التوفر (Availability) غير معروضة:** flow.md خطوة 3 يلزم بعرض "حالة التوفر". لا يوجد حقل `inStock` أو `availability` في Product model، ولا يُعرض في الـ UI. (قد يكون غير مطلوب حسب نموذج المالك الواحد، لكن flow.md يلزم به). |
| A3-3 | 🟠 | `ProductDetail.tsx:65` | **bug في useEffect cleanup:** `if (!data) setCheckingReview(false);` في `.finally` يقرأ `data` من closure الـ effect (دائمًا null في أول تنفيذ) — منطق ملتوي قد يسبب state غير صحيح. |
| A3-4 | 🟠 | `ProductDetail.tsx:66` | **مصفوفة اعتماد ناقصة:** `[slug]` لكن الـ effect يستخدم `user` (سطر 62) — لو غيّر المستخدم حسابه أثناء التصفح، لن يُعاد التحقق من canReview. يجب إضافة `user` أو `user?.id`. |
| A3-5 | 🟠 | `ProductDetail.tsx:101-105` | **خطأ في إدارة الأخطاء:** عند فشل `addItem`، يُضبط `favError` (خطأ مفضلة!) بدلاً من رسالة سلة منفصلة. bug منطقي. |
| A3-6 | 🔴 | `ProductsController.cs:51` | **بديل 2 غير مكتمل:** عند منتج محذوف/غير منشور، يُعاد `NotFound()` (404 افتراضي). flow.md يلزم بصفحة 404 مخصصة بنفس الهوية. الـ NotFound.tsx عام (15 سطر). |
| A3-7 | 🟠 | `ProductDetail.tsx:264-268` | **بديل 3 ناقص:** عند عدم وجود تقييمات، يعرض `t('product.noReviews')` + `t('product.beFirstReview')` للجميع. flow.md يلزم بأن عبارة "كن أول من يقيّم" تظهر فقط للمؤهلين. حاليًا تظهر للزوار غير المسجلين أيضًا. |
| A3-8 | 🟡 | `ProductDetail.tsx:226` | **زر "Added" يستخدم رمز '✓' بدلاً من ترجمة:** نص مُشفّر. يجب `t('product.added')`. |
| A3-9 | 🟡 | `ProductDetail.tsx:352` | **المنتجات ذات الصلة تستخدم `p.price` بدلاً من `p.effectivePrice`:** لا تعرض سعر الخصم. bug بصري. نفس المشكلة في `ProductCard.tsx:50` يستخدم `effectivePrice` ✅ لكن `ProductDetail.tsx:352` لا. |
| A3-10 | 🟡 | `ProductDetail.tsx:249-254` | **حقل `fileSizeMb` يُعرض كـ "MB" مُشفّر:** `{product.fileSizeMb} MB` بدلاً من ترجمة. |
| A3-11 | 🟡 | `ProductDetail.tsx:173` | **العملة `{product.currency || 'DA'}`:** لا تترجم "DA" لـ "د.ج" في العربية. كذلك ProductCard.tsx:50 يُشفّر "DA". |
| A3-12 | 🟠 | `ProductDetail.tsx:108-120` | **handleReviewSubmit لا يحدّث `avgRating`/`reviewCount`** بعد التقييم، فقط `reviews`. الـ Product detail سيظهر إحصائيات قديمة. |
| A3-13 | 🟡 | `ProductDetail.tsx:62-64` | **فحص canReview يتطلب تسجيل دخول** ✅ لكن لا يوجد منطق لتحديث `canReview` عند تسجيل الدخول بعد تحميل الصفحة. |
| A3-14 | 🟡 | `ProductDetail.tsx:330-356` | **المنتجات ذات الصلة تكرر كود ProductCard** بدلاً من استخدامه (DRY violation). الكود مكرر بتصميم أبسط (بدون مفضلة/سلة). |

---

### 3.4 US-A4 — البحث والفلترة

**الملفات المرتبطة:**
- Frontend: `presentation/features/catalog/Catalog.tsx` (شريط البحث في `Layout.tsx:43-49`)، `presentation/features/search/pages/` (فارغ!)
- Frontend data: `data/repos/productRepo.ts` (getAll ← /products/search)
- Backend: `ProductsController.cs` (Search)
- Backend repos: `ProductRepository.cs` (BuildSearchFilter, SearchAsync, SearchWithCountAsync)
- DB: `products` (text index في `SeedData.cs:321-326`)

**التدفق المتوقع (flow.md US-A4):**
1. المستخدم يكتب كلمة في شريط البحث (Header بكل الصفحات) + Enter
2. النظام يبحث في: اسم المنتج + الوصف (بكل اللغات) عبر **MongoDB text index**
3. عرض: عدد النتائج + الكلمة المستخدمة + شبكة نتائج
4. فلاتر جانبية: نطاق السعر (Slider)، الفئة، التقييم (4 نجوم فأكثر)، الترتيب
5. كل تغيير يحدّث النتائج فورًا + تحديث URL query params
- **بديل 1:** لا نتائج → "لم نجد نتائج" + اقتراح مسح الفلاتر/تصفح الفئات
- **بديل 2:** كلمة بحث فارغة → لا يُنفذ البحث

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| A4-1 | 🔴 | `ProductRepository.cs:21-31` | **مخالفة صريحة لـ flow.md خطوة 2:** flow.md يلزم باستخدام **MongoDB text index** للبحث. الـ seed ينشئ text index (`SeedData.cs:321-326`) ✅، لكن `BuildSearchFilter` يستخدم **Regex** لكل حقل على حدة (`Filter.Regex`) بدلاً من `Filter.Text`! هذا: (أ) لا يستفيد من الـ index → أداء ضعيف، (ب) لا يدعم تطابق كلمات متعددة، (ج) قد يفوّت نتائج عربية بسبب تشكيل/تطبيع النص. |
| A4-2 | 🔴 | `Catalog.tsx:184-190` | **بديل 1 غير مكتمل:** flow.md يلزم برسالة "لم نجد نتائج لبحثك" + اقتراح مسح الفلاتر أو تصفح الفئات. الكود يعرض `t('common.notFound')` عام + زر "All". لا اقتراح مسح فلاتر، لا تصفح فئات. |
| A4-3 | 🔴 | `Catalog.tsx:166-178` | **عدم عرض "عدد النتائج" و"الكلمة المستخدمة":** flow.md خطوة 3 يلزم بعرض عدد النتائج + الكلمة المستخدمة. الكود لا يعرض أيًا منهما. الـ backend يرجع `totalCount` لكن الـ Catalog لا يستخدمه للعرض. |
| A4-4 | 🟠 | `Layout.tsx:43-49` | **بديل 2 (كلمة فارغة):** الكود يتحقق `if (searchQuery.trim())` قبل التنقل ✅، لكن الـ Catalog نفسه لا يمنع البحث عن نص فارغ إذا أُرسل عبر URL مباشرة. |
| A4-5 | 🟠 | `App.tsx`، `presentation/features/search/` | **مجلد search مهجور:** يوجد `presentation/features/search/pages/` (فارغ) ولا route له. البحث يُعالَج داخل Catalog. إما حذف المجلد أو تنفيذ صفحة بحث مستقلة. كذلك الـ routes لا تتضمن `/search`. |
| A4-6 | 🟠 | `Catalog.tsx:39-74` | **"تحديث فوري" غير محقق بدقة:** flow.md خطوة 5 يلزم بتحديث النتائج فورًا عند تغيير فلتر. الكود يعتمد على `useEffect` الذي يعيد التحميل، لكن كل تغيير input في `minPrice`/`maxPrice` (أسطر 130-143) يطلق طلبًا للـ backend (debounce مفقود). قد يغرق الـ API بطلبات. |
| A4-7 | 🟡 | `Catalog.tsx:151` | **خيارات التقييم محدودة:** flow.md يذكر "4 نجوم فأكثر..." — الكود يوفر `4★+` و`3★+` فقط. قد يكون كافيًا لكن أقل مرونة. |
| A4-8 | 🟠 | `ProductRepository.cs:39-40` | **فلتر `minRating` يعتمد على `AvgRating` المخزّن:** لكن `AvgRating` يُحدّث فقط عند `UpdateAvgRatingAsync` (بعد تقييم جديد). لو لم يُحدّث، فلتر التقييم سيكون غير دقيق. |
| A4-9 | 🟡 | `Layout.tsx:64-70` | **شريط البحث مخفي في الموبايل:** `hidden md:flex`. مستخدمو الموبايل لا يمكنهم البحث! flow.md يلزم بتوفر البحث في "كل الصفحات". لا يوجد زر بحث بديل للموبايل. |
| A4-10 | 🟡 | `Catalog.tsx:87-96` | **PriceRangeSlider يطلق `onChange` في كل تغيير** (سطر 259، 272) → طلبات متعددة أثناء السحب. يحتاج debounce أو onCommit. |
| A4-11 | 🟡 | `Catalog.tsx:239-283` | **PriceRangeSlider مكون محلي:** معرّف داخل Catalog.tsx بدلاً من `presentation/shared/components/` (الذي فارغ). مخالفة هيكلية. |
| A4-12 | 🟠 | `Catalog.tsx:151` | **"common.all" يُستخدم كـ label للـ "all ratings":** إعادة استخدام مفتاح ترجمة عام قد يعطي نصًا غير مناسب (مثلاً "الكل" بدلاً من "كل التقييمات"). |

---

## 4. 🟢 Epic B — حساب المستخدم

### 4.1 US-B1 — إنشاء حساب

**الملفات المرتبطة:**
- Frontend: `presentation/features/auth/Auth.tsx` (113 سطر)، `presentation/features/auth/pages/` (فارغ)، `presentation/features/auth/components/` (فارغ)
- Frontend data: لا يوجد `authRepo.ts` منفصل! (الـ auth store يستدعي الـ API مباشرة)
- Backend: `AuthController.cs` (Register)، `Validators/RequestValidators.cs`
- Backend services: `AuthService.cs` (RegisterAsync)
- DB: `users`

**التدفق المتوقع (flow.md US-B1):**
1. الزائر يضغط "تسجيل"
2. يملأ: الاسم الكامل، البريد، رقم الهاتف، كلمة المرور، تأكيد كلمة المرور
3. التحقق محليًا ثم في API
4. API يتحقق أن البريد غير مستخدم، يشفّر كلمة المرور (bcrypt/argon2)، ينشئ مستخدم بدور Customer
5. يُعاد JWT، يُسجّل دخول تلقائيًا، يُوجَّه للرئيسية مع رسالة ترحيب
- **بديل 1:** بريد مستخدم مسبقًا → رسالة + رابط لتسجيل الدخول
- **بديل 2:** كلمة مرور < 8 خانات → رسالة تحت الحقل
- **بديل 3:** كلمتا مرور غير متطابقتين → رسالة فورية

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| B1-1 | 🔴 | `auth/store.ts` | **لا يوجد `authRepo.ts`:** prompt.md القسم 3 يلزم بـ `data/<entity>/<entity>.repository.ts`. الـ auth store يستدعي `api.post('/auth/login')` مباشرة. مخالفة هيكلية Repository Pattern. |
| B1-2 | 🔴 | `core/auth/store.ts:26` | **قراءة `user` من localStorage عند init:** `JSON.parse(localStorage.getItem('user') \|\| 'null')`. هذا: (أ) لا يتحقق من صحة الـ token مع الخادم عند بدء التطبيق، (ب) يثق في بيانات مخزّنة قد تكون قديمة/معدّلة. `loadUser()` يُستدعى في App.tsx ✅ لكن يحدث بعد أول render. |
| B1-3 | 🔴 | `RequestValidators.cs:13` | **طول كلمة المرور 6 بدلاً من 8:** `MinimumLength(6)`. flow.md US-B1 بديل 2 يلزم صراحةً بـ "8 خانات". مخالفة صريحة. كذلك `ResetRequestValidator:37` و`ChangePasswordRequestValidator:56`. |
| B1-4 | 🔴 | `AuthService.cs:22-34` | **Race condition في التحقق من تفرّد البريد:** `GetByEmailAsync` ثم `InsertAsync`. في عمليات متزامنة قد يُنشأ حسابان بنفس البريد. يجب استخدام unique index على `email` في MongoDB. لا يوجد index فريد في `EnsureIndexesAsync`. |
| B1-5 | 🟠 | `Auth.tsx:30`، `RequestValidators.cs` | **عدم تحقق backend من تطابق كلمتي المرور:** التحقق فقط في frontend. backend لا يستقبل `confirmPassword` أصلاً. غير آمن — يمكن تجاوزه. |
| B1-6 | 🟠 | `AuthService.cs:20-37` | **لا يوجد بريد ترحيب/تأكيد التسجيل:** requirements Stakeholder #4 يلزم بـ "تأكيد التسجيل". `RegisterAsync` لا يستدعي `_notif`. |
| B1-7 | 🟡 | `Auth.tsx:62-67` | **لا تحقق HTML لطول الهاتف/الصيغة:** input `phone` بدون `pattern` أو `type="tel"`. الـ backend `MaximumLength(20)` فقط. |
| B1-8 | 🟡 | `Auth.tsx` | **لا رسالة ترحيب بعد التسجيل:** flow.md US-B1 خطوة 5 يلزم بـ "رسالة ترحيب". الكود `navigate('/')` فقط بلا رسالة. |
| B1-9 | 🟠 | `AuthService.cs:29`،`AuthController.cs:32` | **BUG: LoginAsync لا يطبّع البريد لـ lower:** `RegisterAsync` يخزّن `email.ToLowerInvariant()` ✅ و`UserRepository.GetByEmailAsync` يبحث بـ lower ✅، لكن `LoginAsync` يستخدم `email` كما ورد من controller. لو سجّل بـ `User@X.com` ثم حاول الدخول بـ `user@x.com` سيفشل. bug فعلي. |
| B1-10 | 🟡 | `Auth.tsx:14-15` | **`initialMode` يُضبط مرة واحدة:** لو غيّر المستخدم الـ URL param `mode` بعد التحميل، الـ state لن يُحدّث. |

### 4.2 US-B2 — تسجيل الدخول والخروج

**الملفات المرتبطة:** نفس US-B1 + `core/api/client.ts` (interceptor 401)

**التدفق المتوقع:**
- دخول: بريد + كلمة مرور → JWT → تخزين آمن (HttpOnly cookie أو Secure storage) → redirect
- خروج: مسح token + Auth Context → redirect
- **بديل 1:** بيانات خاطئة → رسالة عامة
- **بديل 2:** حساب محظور → "حسابك موقوف، تواصل مع الدعم"
- **بديل 3:** انتهاء صلاحية Token → redirect لتسجيل الدخول + حفظ الوجهة

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| B2-1 | 🔴 | `core/api/client.ts:6`، `core/auth/store.ts:35` | **تخزين JWT في localStorage** بدلاً من HttpOnly cookie. flow.md US-B2 يلزم صراحةً بـ "HttpOnly cookie أو Secure storage". localStorage عرضة لـ XSS. مخالفة أمنية. |
| B2-2 | 🟠 | `client.ts:14-19` | **interceptor 401 يُعيد توجيهًا قسريًا:** `window.location.href` (reload كامل) بدلاً من React Router. يفقد state التطبيق. |
| B2-3 | 🟠 | `client.ts:14` | **استثناء login/register فقط:** `forgot-password` و`reset-password` غير مستثناة → قد يسبب redirect loops. |
| B2-4 | 🟡 | `auth/store.ts:38-43` | **رسالة الخطأ العامة:** `'Invalid credentials'` ✅. لكن يجب التحقق من أن الـ backend لا يكشف أي بريد مسجل. |
| B2-5 | 🟠 | `auth/store.ts:59-63` | **logout لا يلغي الـ token في الـ backend:** فقط يمسحه محليًا. لا يوجد token blacklist أو revocation. |
| B2-6 | 🔴 | `AuthService.cs:39-50`،`Auth.tsx:26-28` | **بديل 3 (حفظ الوجهة الأصلية) ناقص:** `client.ts:17-18` يحفظ `next` ✅، لكن `Auth.tsx` **لا يقرأ `next` param** بعد تسجيل الدخول — دائمًا `navigate('/')`. مخالفة لـ flow.md. |
| B2-7 | 🟡 | `AuthController.cs:35` | **رسالة الخطأ بالإنجليزية:** `"Invalid email or password"` مُشفّرة. يجب أن تكون مترجمة. |
| B2-8 | 🔴 | `AuthService.cs:45-46` | **بديل 2 (الحساب المحظور):** يرمي `"This account has been suspended. Please contact support."` ✅، لكن الكشف يتم بعد التحقق من كلمة المرور (سطر 42) → يكشف أن كلمة المرور صحيحة للحساب المحظور (تسريب معلومات). يجب التحقق من `IsBanned` قبل كلمة المرور أو إرجاع رسالة عامة. |

### 4.3 US-B3 — تعديل الملف الشخصي

**الملفات المرتبطة:**
- Frontend: `presentation/features/account/Account.tsx` (243 سطر)
- Backend: `AuthController.cs` (UpdateProfile, ChangePassword)
- Backend services: `AuthService.cs` (UpdateProfileAsync, ChangePasswordAsync)

**التدفق المتوقع:**
1. فتح "حسابي" → "الملف الشخصي"
2. عرض بيانات (الاسم، الهاتف، الولاية، البريد [غير قابل للتعديل])
3. تعديل + حفظ
4. رسالة نجاح
- **بديل 1:** هاتف بصيغة خاطئة → رسالة
- **بديل 2:** تغيير كلمة المرور: يتطلب كلمة المرور الحالية أولًا

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| B3-1 | 🔴 | `RequestValidators.cs:47` | **WilayaCode نطاق 1-58 بدلاً من 1-69:** `InclusiveBetween(1, 58)`. المشروع يلزم بـ 69 ولاية (prompt.md القسم 7). كل المستخدمين في الولايات 59-69 سيُرفضون! نفس bug في `PlaceOrderReqValidator:67`. **حرج.** |
| B3-2 | 🔴 | `Account.tsx:171-172` | **`wilayaCode` يُعرض كرقم وليس اسم الولاية:** `{(user as any).wilayaCode}`. الـ user model في الـ frontend لا يحتوي `wilayaName`. UX سيء. |
| B3-3 | 🟠 | `Account.tsx:46-52` | **`saveProfile` يستخدم `alert(t('common.error'))`:** بدلاً من رسالة inline. غير متسق. |
| B3-4 | 🟠 | `Account.tsx:46` | **`api.put('/auth/profile', form)` يرسل `form` كامل:** شامل `wilayaCode: 0` عند عدم الاختيار. قد يمسح قيمة صحيحة. |
| B3-5 | 🟡 | `Account.tsx:191-195` | **dropdown الولاية لا يعرض الولاية الحالية:** عند `wilayaCode === 0` يعرض `--`. |
| B3-6 | 🟠 | `Account.tsx:224-236` | **تغيير كلمة المرور inline handler:** منطق الـ submit داخل `onClick` بدلاً من دالة مستقلة. |
| B3-7 | 🟠 | `RequestValidators.cs:46` | **لا تحقق من صيغة الهاتف:** `MaximumLength(20)` فقط. flow.md US-B3 بديل 1 يلزم برسالة عند صيغة خاطئة. |
| B3-8 | ✅ | `AuthService.cs:90-99` | **تغيير كلمة المرور يتطلب الحالية ✅** مطابق لـ flow.md بديل 2. |

### 4.4 US-B4 — استعادة كلمة المرور

**الملفات المرتبطة:**
- Frontend: `Auth.tsx` (forgot/reset modes)
- Backend: `AuthController.cs` (ForgotPassword, ResetPassword)
- Backend services: `AuthService.cs` (RequestPasswordResetAsync, ResetPasswordAsync)
- Backend notifications: `NotificationService.cs` (PasswordResetAsync)

**التدفق المتوقع:**
1. "نسيت كلمة المرور؟" → إدخال بريد
2. توليد رمز/رابط صالح لمدة محدودة (30 دقيقة) + إرسال بالبريد
3. فتح الرابط → صفحة كلمة مرور جديدة → مرتين → تأكيد
4. تحديث كلمة المرور المشفّرة + رسالة نجاح
- **بديل 1:** بريد غير مسجّل → نفس رسالة "إذا كان مسجلاً ستصلك"
- **بديل 2:** رابط منتهي/مستخدم → "الرابط غير صالح، اطلب جديدًا"

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| B4-1 | 🔴 | `AuthService.cs:52-60` | **BUG حرج: `PasswordResetAsync` لا يُستدعى أبدًا!** `RequestPasswordResetAsync` يولّد token ويحدّث المستخدم في الـ DB، لكن **لا يستدعي `_notif.PasswordResetAsync()`** (لا يوجد حقن `INotificationService` في الـ constructor). الرابط لا يُرسل. المستخدم ينتظر بريدًا لن يصل. |
| B4-2 | 🔴 | `NotificationService.cs:27-31` | **Email sending placeholder:** حتى لو استُدعيت، `PasswordResetAsync` فقط يكتب log (`[EMAIL-PLACEHOLDER]`). **الميزة لا تعمل فعليًا.** حرج للإطلاق. |
| B4-3 | 🔴 | `AuthService.cs:57-59` | **PasswordResetToken يُخزّن كنص صريح:** `Guid.NewGuid().ToString("N")`. يجب hash قبل التخزين. |
| B4-4 | 🟠 | `AuthController.cs:42` | **رسالة "If this email is registered..." مُشفّرة بالإنجليزية:** يجب أن تكون مترجمة. |
| B4-5 | 🟠 | `AuthService.cs:62-73` | **ResetPasswordAsync لا يبطل الجلسات الحالية:** الـ token القديم يبقى صالحًا. |
| B4-6 | 🟡 | `Auth.tsx:80-90` | **reset mode لا يتحقق من تطابق كلمتي المرور:** `confirmPassword` يُجمع لكن لا يُقارن بـ `password` قبل الإرسال. |
| B4-7 | 🟡 | `Auth.tsx:82` | **`<input type="hidden" value={form.token} />` غير ضروري.** |
| B4-8 | ✅ | `AuthService.cs:58` | **صلاحية 30 دقيقة ✅** مطابق لـ prompt.md. |
| B4-9 | ✅ | `AuthService.cs:55` | **بديل 1 (عدم تسريب البريد):** `if (user == null) return;` صامتًا ✅. |

---

## 5. 🟡 Epic C — المفضلة والسلة

### 5.1 US-C1 — إضافة إلى المفضلة

**الملفات المرتبطة:**
- Frontend: `presentation/shared/ProductCard.tsx`، `presentation/features/product/ProductDetail.tsx`
- Frontend data: `data/repos/orderRepo.ts` (favoriteRepo)
- Backend: `CartOrdersFavoritesController.cs` (FavoritesController)
- Backend services: `CartFavoriteService.cs` (FavoriteService)
- DB: `favorites`

**التدفق المتوقع (flow.md US-C1):**
1. المستخدم يضغط أيقونة "قلب" على بطاقة منتج أو في صفحة تفاصيله
2. الـ API يضيف سجلًا (customerId + productId)
3. الأيقونة تتحول لحالة "مُفعّلة" فورًا (Optimistic UI)
4. المنتج يظهر في "حسابي → المفضلة"
- **بديل 1:** مضاف مسبقًا والضغط مجددًا → يُزال (Toggle)
- **بديل 2:** غير مسجل → توجيه لصفحة الدخول

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| C1-1 | 🔴 | `ProductCard.tsx:19` | **`isFav` يبدأ دائمًا `false`:** لا يُجلب من الـ backend عند تحميل البطاقة. كل بطاقة ستظهر كغير مفضّلة حتى يضغطها المستخدم. الـ backend يوفر `GET /api/favorites/{productId}` و`ProductDetail.tsx` يجلب `isFavorite` ✅، لكن `ProductCard` لا. **bug بصري.** |
| C1-2 | 🟠 | `ProductCard.tsx:86` | **زر المفضلة يظهر فقط على hover (`opacity-0 group-hover:opacity-100`):** في الموبايل لا hover → المستخدم لا يستطيع الوصول للزر. |
| C1-3 | 🟠 | `CartFavoriteService.cs:102-112` | **`GetMyFavoritesAsync` يجلب المنتجات N+1 queries:** لكل favorite، يستدعي `GetByIdAsync` منفصلًا. مع 100 مفضلة = 100 query. يجب استخدام `$in` filter. نفس المشكلة في `CartService.GetProductsAsync`. |
| C1-4 | 🟡 | `ProductCard.tsx:77` | **redirect للـ login يستخدم `navigate` ✅** لكن الـ Auth.tsx لا يقرأ `next` (راجع B2-6). |
| C1-5 | 🟡 | `FavoriteAndCart.cs:18-19` | **Favorite model لا يحتوي `productName`/`imageUrl`:** الـ frontend يجلب المنتجات كاملة لاحقًا. مقبول لكن غير مثالي. |
| C1-6 | ✅ | `FavoriteService.cs:93-100` | **ToggleAsync ✅** يحقق بديل 1. |

### 5.2 US-C2 — إضافة إلى السلة

**الملفات المرتبطة:**
- Frontend: `presentation/features/cart/Cart.tsx` (79 سطر)، `core/store/cart.ts`
- Frontend data: لا يوجد `cartRepo.ts` منفصل
- Backend: `CartOrdersFavoritesController.cs` (CartController)
- Backend services: `CartFavoriteService.cs` (CartService)
- DB: `carts`

**التدفق المتوقع (flow.md US-C2):**
1. المستخدم يضغط "إضافة للسلة" من صفحة المنتج (مع تحديد الكمية)
2. المنتج يُضاف لسلة الجلسة (State محلي + مُزامَن مع Backend لاستمراريتها بين الأجهزة)
3. أيقونة السلة في Header يُحدّث عدّادها فورًا
4. فتح صفحة السلة، تعديل الكميات، حذف عنصر
- **بديل 1:** المنتج موجود مسبقًا → تُزاد الكمية
- **بديل 2:** السلة فارغة عند فتح "تقديم الطلب" → redirect + رسالة

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| C2-1 | 🔴 | `core/store/cart.ts:38-39` | **BUG: `addItem` يستخدم `window.location.href = '/auth?mode=login'`:** reload كامل بدلاً من React Router `navigate`. progress.md يزعم إصلاح هذا (Phase 5) لكنه لا يزال موجودًا! يفقد state. الكود داخل Zustand store (لا access لـ `navigate`) — يحتاج refactoring. |
| C2-2 | 🟠 | `cart.ts:24-26` | **عدم وجود `cartRepo.ts`:** prompt.md القسم 3 يلزم بـ `data/cart/cart.repository.ts`. الـ store يستدعي API مباشرة. مخالفة هيكلية. |
| C2-3 | 🟡 | `CartController.cs:21-32` | **`productName = p?.Name?.Ar ?? p?.Name?.En ?? ""`:** يرجع الاسم بالعربية فقط! يجب أن يرجع كائن LocalizedString كامل. bug i18n — المستخدم الفرنسي سيرى أسماء عربية في السلة. |
| C2-4 | 🟠 | `CartService.cs:28-38` | **`AddAsync` لا يتحقق من حد أقصى للكمية:** يمكن إضافة 1000 وحدة. |
| C2-5 | 🟠 | `Checkout.tsx:24`،`Cart.tsx` | **بديل 2 (redirect عند سلة فارغة) ناقص:** `Checkout.tsx:24` `if (items.length === 0) return;` — لكنه لا redirect لصفحة السلة مع رسالة. يعرض فقط الـ form فارغًا. |
| C2-6 | 🟡 | `Cart.tsx:8` | **destructure من `useCartStore` بدون selector:** يسبب re-render عند أي تغيير في store. |
| C2-7 | 🟡 | `Cart.tsx:46` | **"DA" مُشفّر:** `item.price.toLocaleString() DA`. |
| C2-8 | ✅ | `CartService.cs:31-34` | **بديل 1 (إضافة الكمية) ✅** مطابق. |
| C2-9 | ✅ | `Layout.tsx:40` | **عدّاد السلة في Header ✅** يتحدّث فورًا. |

---

## 6. 🟠 Epic D — تقديم الطلب

### 6.1 US-D1 — تقديم طلب

**الملفات المرتبطة:**
- Frontend: `presentation/features/checkout/Checkout.tsx` (143 سطر)
- Frontend data: `data/repos/orderRepo.ts` (create)
- Backend: `CartOrdersFavoritesController.cs` (OrdersController.Place)
- Backend services: `OrderService.cs` (PlaceAsync)
- DB: `orders`, `carts`

**التدفق المتوقع (flow.md US-D1):**
1. المستخدم يضغط "متابعة الطلب" من صفحة السلة
2. صفحة الطلب: ملخص المنتجات + نموذج (الاسم، الهاتف، البريد، الولاية Dropdown من 69 ولاية)
3. مراجعة + "تأكيد الطلب"
4. الـ API ينشئ Order بحالة `Pending`، يربطه بـ customerId، ويُفرّغ السلة
5. إشعار بريدي للمستخدم + إشعار داخلي للأدمين
6. redirect لصفحة "تم استلام طلبك" مع رقم مرجعي
- **بديل 1:** فشل الإرسال → رسالة خطأ + السلة تبقى
- **بديل 2:** حقل الولاية/الهاتف فارغ/غير صالح → منع الإرسال
- **بديل 3:** منتج أصبح غير متوفر/محذوف → إزالته + تنبيه قبل التأكيد النهائي

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| D1-1 | 🔴 | `OrderService.cs:36-44` | **بديل 3 مخالف:** flow.md يلزم بـ "إزالته تلقائيًا **مع تنبيه للمستخدم قبل التأكيد النهائي**". الـ backend يحذف صامتًا (`if (product == null \|\| product.IsDeleted) continue;`). الـ frontend يفحص قبل التحميل ✅ لكن لا يفحص لحظة التأكيد. لو حُذف منتج بين الفحص والتأكيد، الطلب يُنشأ بدون تنبيه. |
| D1-2 | 🔴 | `OrderService.cs:63-76` | **BUG في transaction:** `using var session = await _mongo.Client.StartSessionAsync();` لكن `InsertAsync` و`UpdateAsync` في `MongoRepository` لا تستقبل session parameter! الـ transaction لا يمرر للعمليات الفعلية. الكود يبدو transaction لكنه **ليس كذلك فعليًا** — كل عملية منفصلة. لو فشل `UpdateAsync(cart)`، الطلب يبقى في الـ DB لكن السلة لا تُفرَّغ. **حرج لسلامة البيانات.** |
| D1-3 | 🔴 | `Checkout.tsx:71-73` | **بديل 1 ضعيف:** عند فشل الطلب، `catch { alert(t('common.error')); }`. يستخدم `alert` (سيئ UX)، لا رسالة محددة، ولا زر "إعادة المحاولة". |
| D1-4 | 🔴 | `Checkout.tsx:117` | **button disabled عند `!!availError`:** يمنع التقديم نهائيًا لو وُجد منتج محذوف — لكن لا يوجد زر "متابعة بدون المنتج المحذوف". المستخدم عالق. |
| D1-5 | 🔴 | `RequestValidators.cs:67` | **WilayaCode نطاق 1-58 بدلاً من 1-69** (نفس bug B3-1). 11 ولاية جديدة مرفوضة. **حرج.** |
| D1-6 | 🟠 | `Checkout.tsx:24-34` | **فحص التوفر N+1 queries:** لكل عنصر في السلة، يستدعي `api.get('/products/${item.productId}')`. مع 10 عناصر = 10 طلبات. يجب endpoint واحد `POST /cart/validate`. |
| D1-7 | 🟠 | `OrderService.cs:54` | **`GenerateReferenceAsync` غير atomic:** يستعلم `GetTodayCountAsync` ثم يضيف 1. مع طلبات متزامنة، قد يتكرر الـ reference. يجب استخدام sequence. |
| D1-8 | 🟡 | `OrderService.cs:60` | **`StatusHistory` يُسجّل `AdminId = customerId`:** الـ customerId ليس adminId! bug منطقي. |
| D1-9 | 🟠 | `OrderService.cs:78-79` | **الإشعارات بعد الـ transaction:** لو فشلت، الـ transaction نجح لكن المستخدم يرى خطأ. يجب أن تكون fire-and-forget أو في try/catch منفصل. |
| D1-10 | 🟡 | `Checkout.tsx:130` | **"DA" مُشفّر:** `item.price * item.quantity` يستخدم `toLocaleString()` بدون عملة قابلة للترجمة. |
| D1-11 | ✅ | `OrderService.cs:68` | **السلة تُفرَّغ بعد نجاح الـ transaction ✅** مطابق لـ prompt.md (القرار: "السلة لا تُفرّغ عند الفشل"). |

### 6.2 US-D2 — رسالة تأكيد الطلب

**الملفات المرتبطة:**
- Backend: `OrderService.cs` (يستدعي `_notif.OrderReceivedAsync`)، `NotificationService.cs`

**التدفق المتوقع:**
1. فور إنشاء الطلب، يُستدعى Notification Service
2. رسالة بريدية (بلغة العميل المفضّلة أو العربية) تحتوي: رقم الطلب، قائمة المنتجات، "سيتم التواصل معك قريبًا"
3. تُرسل عبر مزود البريد
- **بديل 1:** فشل البريد → لا يُفشَل الطلب؛ يُسجَّل الخطأ في اللوق

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| D2-1 | 🔴 | `NotificationService.cs:13-18` | **Email sending placeholder:** `OrderReceivedAsync` فقط يكتب log (`[EMAIL-PLACEHOLDER]`). لا يُرسل بريد فعلي. **الميزة لا تعمل.** مخالفة لـ flow.md US-D2. |
| D2-2 | 🟠 | `NotificationService.cs:13-18` | **لا تُمرَّر لغة العميل:** `OrderReceivedAsync` يستقبل `Order` فقط، لا `PreferredLang`. flow.md يلزم بـ "بلغة العميل المفضّلة أو العربية افتراضيًا". |
| D2-3 | 🟠 | `NotificationService.cs` | **لا قالب بريد (template):** flow.md يلزم برسالة تحتوي رقم الطلب + قائمة المنتجات + نص "سيتم التواصل". الكود لا يبني أي قالب. |
| D2-4 | 🟠 | `OrderService.cs:78` | **`await` على notification بدون try/catch:** لو رمى exception، الـ controller سيرجع 500 رغم نجاح الطلب. flow.md بديل 1 يلزم بأن فشل البريد لا يُفشل الطلب. |

### 6.3 US-D3 — متابعة سجل الطلبات (العميل)

**الملفات المرتبطة:**
- Frontend: `presentation/features/account/Account.tsx` (orders tab)
- Frontend data: `data/repos/orderRepo.ts` (getMyOrders)
- Backend: `CartOrdersFavoritesController.cs` (OrdersController.Mine، GetById)

**التدفق المتوقع:**
1. المستخدم يفتح "حسابي → طلباتي"
2. تُجلب كل الطلبات المرتبطة بـ customerId، مرتبة (الأحدث للأقدم)
3. عرض: رقم الطلب، التاريخ، الحالة (شارة ملوّنة)، الإجمالي
4. الضغط على طلب يفتح تفاصيله (المنتجات، الملاحظات من الأدمين إن وُجدت)
- **بديل 1:** لا طلبات → Empty State + زر "تصفح المنتجات"

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| D3-1 | 🔴 | `Account.tsx:86` | **`item.productName` يُعرض ككائن!** `OrderItem.ProductName` في الـ backend هو `LocalizedString` (Order.cs:13). الـ frontend type يتعامل معه كـ string. سيعرض `[object Object]`! **bug حرج للعرض.** |
| D3-2 | 🔴 | `Account.tsx` | **عدم عرض "الملاحظات من الأدمين الموجّهة للعميل":** flow.md US-D3 خطوة 4 يلزم بـ "الملاحظات إن وُجدت من الأدمين موجّهة للعميل". الـ Order model له `PublicNote` (Order.cs:86) لكن `Account.tsx` لا يعرضه. كذلك الـ backend لا يعرضه في response. |
| D3-3 | 🟠 | `Account.tsx:89` | **`toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language)`:** منطق مبسط. يجب استخدام locale كامل. |
| D3-4 | 🟡 | `Account.tsx:34` | **`orderRepo.getMyOrders().then(setOrders).catch(() => {})`:** catch فارغ! لو فشل الطلب، المستخدم يرى قائمة فارغة بلا رسالة. |
| D3-5 | 🟠 | `Account.tsx:116` | **عرض `statusHistory` للعميل:** قد يكشف معلومات داخلية (AdminId). الـ backend يرجع كامل الـ Order object. يجب filtering. |
| D3-6 | ✅ | `OrdersController.cs:97` | **`GetById` يتحقق من `order.CustomerId != UserId` ✅** حماية جيدة. |
| D3-7 | ✅ | `OrderRepository.cs:13-15` | **الترتيب بالـ `CreatedAt` تنازليًا ✅** مطابق لـ flow.md. |

### 6.4 US-D4 — تواصل الأدمين لتأكيد الطلب

**الملفات المرتبطة:**
- Backend: `AdminReviewsController.cs` (Order detail، status change، notes)
- Frontend: `AdminDashboard.tsx` (orders tab)
- خارج النظام: هاتف/بريد

**التدفق المتوقع:**
1. الأدمين يفتح تفاصيل الطلب (US-G2)
2. يتصل/يراسل العميل يدويًا خارج الموقع
3. يغيّر حالة الطلب (US-G3) + ملاحظة داخلية (US-G4)

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| D4-1 | 🟡 | (خارج النطاق) | US-D4 يدوي بطبيعته. الاعتماد على US-G2/G3/G4 ✅. |
| D4-2 | 🟠 | `AdminDashboard.tsx` | **(يحتاج قراءة كاملة)** — للتحقق من أزرار `tel:` و`mailto:` في تفاصيل الطلب (US-G2 يلزم). |

---

## 7. 🟣 Epic E — التقييمات

### 7.1 US-E1 — كتابة تقييم

**الملفات المرتبطة:**
- Frontend: `presentation/features/product/ProductDetail.tsx` (review form)
- Frontend data: `data/repos/orderRepo.ts` (reviewRepo.create، canReview)
- Backend: `AdminReviewsController.cs` (يحتوي على reviews endpoints — يحتاج قراءة)
- Backend services: `ReviewService.cs` (SubmitOrUpdateAsync، CanReviewAsync)
- DB: `reviews`, `orders`

**التدفق المتوقع (flow.md US-E1):**
1. من "طلباتي" أو صفحة المنتج، يظهر للعميل المؤهّل زر "أضف تقييمك"
2. نموذج: نجوم (1-5) + تعليق نصي اختياري
3. "إرسال" → مستند Review بحالة `PendingApproval`
4. رسالة "شكرًا، سيظهر تقييمك بعد المراجعة"
- **بديل 1:** العميل لم يشترِ/الطلب لم يكتمل → لا يظهر الزر
- **بديل 2:** تقييم نفس المنتج مرتين → يُسمح بالتعديل بدلًا من إنشاء جديد

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| E1-1 | 🔴 | `ReviewService.cs:20-32` | **ثغرة أمنية حرجة:** `SubmitOrUpdateAsync` يتحقق من الطلب فقط إن وُجد `orderId`: `if (!string.IsNullOrWhiteSpace(orderId))`. لو لم يُرسل الـ frontend `orderId` (ProductDetail.tsx:113 لا يرسله!)، **لا يتحقق من الشراء أبدًا**. يمكن لأي مستخدم مسجل تقييم أي منتج! |
| E1-2 | 🔴 | `ReviewService.cs:23` | **`orderId` غير مطلوب:** prompt.md يلزم بـ "العميل قدّم طلبًا يحتوي هذا المنتج وحالته `Completed`". الكود يجعل `orderId` اختياريًا، مما يفتح ثغرة E1-1. يجب إجبار `orderId`. |
| E1-3 | 🔴 | `ReviewService.cs:83-89` | **`CanReviewAsync` يسمح بالتعديل بلا قيود:** `if (existing.Any()) return true;`. لكن **لا يتحقق أن التقييم الموجود كان لطلب مكتمل**. يمكن التقييم مرة، ثم التعديل بلا قيود. |
| E1-4 | 🟠 | `ProductDetail.tsx:113` | **`handleReviewSubmit` لا يرسل `orderId`:** flow.md يلزم بربط التقييم بالطلب. الكود يرسل `{ productId, rating, comment }` فقط. |
| E1-5 | 🟠 | `ProductDetail.tsx:293`،`Account.tsx` | **زر \"أضف تقييمك\" يظهر في صفحة المنتج ✅** لكن **لا يظهر في "طلباتي"** (Account.tsx). flow.md يلزم بظهوره في "طلباتي أو صفحة المنتج". ناقص في Account.tsx. |
| E1-6 | 🟡 | `ProductDetail.tsx:110` | **`if (!data \|\| !reviewComment.trim()) return;`:** تعليق فارغ يمنع الإرسال. لكن flow.md يقول "تعليق نصي اختياري". يجب السماح بتقييم بدون تعليق. |
| E1-7 | 🟠 | `ReviewService.cs:34-44` | **التحقق من `existing` يجلب كل التقييمات:** لو وُجد عدة (race)، يحدّث أولًا فقط. يجب منع التكرار بـ unique index على (customerId, productId). |
| E1-8 | 🟠 | `ProductDetail.tsx:115-116` | **بعد التقييم، لا يحدّث `canReview`:** المستخدم قد يحاول التقييم مرة أخرى (سيُعدّل — لكن الـ UI لا يعكس ذلك). |
| E1-9 | 🟡 | `ProductDetail.tsx:296` | **رسالة النجاح لا تختفي تلقائيًا.** |

### 7.2 US-E2 — عرض التقييمات المعتمدة

**الملفات المرتبطة:**
- Frontend: `ProductDetail.tsx` (reviews section)
- Backend: `ProductsController.cs` (GetBySlug يجلب reviews)، `ReviewService.cs`

**التدفق المتوقع:**
1. أي زائر/عميل يفتح تبويب "التقييمات"
2. تُجلب فقط التقييمات `Approved`، مرتبة (الأحدث أو الأعلى تقييمًا)
3. لكل تقييم: اسم العميل (أو مختصر)، النجوم، التعليق، التاريخ
4. متوسط التقييم العام معروض
- **بديل 1:** لا تقييمات معتمدة → "لا توجد تقييمات بعد، كن أول من يقيّم" (للمؤهلين)

**التحقق من التنفيذ والأخطاء:**

| # | الخطورة | الموقع | الخطأ / النقص |
|---|---|---|---|
| E2-1 | 🟠 | `ProductDetail.tsx:264-268` | **بديل 1 غير دقيق:** يعرض `t('product.beFirstReview')` للجميع. flow.md يلزم بأن تظهر فقط للمؤهلين. راجع A3-7. |
| E2-2 | 🟡 | `ProductDetail.tsx:274` | **اسم العميل `r.customerName` يُعرض كاملًا:** flow.md يلزم بـ "اسم العميل (أو مختصر)". لا يوجد masking (مثل "Ahmed B."). مخالفة خصوصية. |
| E2-3 | 🟡 | `ProductDetail.tsx:286` | **التاريخ غير معروض:** flow.md خطوة 3 يلزم بعرض "التاريخ". الكود لا يعرض `r.createdAt`. |
| E2-4 | 🟠 | `ReviewService.cs:61-62` | **الترتيب بالـ `CreatedAt` فقط:** flow.md يلزم بـ "الأحدث أو الأعلى تقييمًا". خيار واحد فقط. |
| E2-5 | ✅ | `ReviewRepository.cs:194-196` | **يجلب فقط `Approved` ✅** مطابق لـ flow.md. |

