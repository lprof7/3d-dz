using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Api.Seed;

public static class SeedData
{
    public static async Task SeedAsync(IServiceProvider sp)
    {
        var wilayaSvc = sp.GetRequiredService<IWilayaService>();
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var catRepo = sp.GetRequiredService<ICategoryRepository>();
        var colRepo = sp.GetRequiredService<ICollectionRepository>();
        var prodRepo = sp.GetRequiredService<IProductRepository>();
        var orderRepo = sp.GetRequiredService<IOrderRepository>();
        var reviewRepo = sp.GetRequiredService<IReviewRepository>();
        var bannerRepo = sp.GetRequiredService<IBannerRepository>();

        // 1. Wilayas
        var wilayasCount = await wilayaSvc.GetAllAsync();
        if (wilayasCount.Count == 0)
        {
            var wilayas = GetWilayas();
            foreach (var w in wilayas) await wilayaSvc.SeedAsync(new List<Wilaya> { w });
        }

        // 2. Admin
        var admin = await userRepo.GetByEmailAsync("admin@3ddz.dz");
        if (admin == null)
        {
            admin = new User
            {
                FullName = "Admin 3D DZ",
                Email = "admin@3ddz.dz",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                PreferredLang = "ar"
            };
            await userRepo.InsertAsync(admin);
        }

        // 3. Categories
        var cats = await catRepo.GetAllAsync();
        if (cats.Count == 0)
        {
            var categoryData = GetCategoryData();
            foreach (var c in categoryData) await catRepo.InsertAsync(c);
            cats = await catRepo.GetAllAsync();
        }

        // 4. Collections
        var cols = await colRepo.GetAllAsync();
        if (cols.Count == 0)
        {
            var collectionData = GetCollectionData(cats);
            foreach (var c in collectionData) await colRepo.InsertAsync(c);
        }

        // 5. Products
        var products = await prodRepo.GetAllAsync();
        if (products.Count == 0)
        {
            var productData = GetProductData(cats);
            foreach (var p in productData) await prodRepo.InsertAsync(p);
            products = await prodRepo.GetAllAsync();
        }

        // 6. Sample Customers
        var customerEmails = new[] { "ahmed@example.dz", "fatima@example.dz", "mohamed@example.dz", "amina@example.dz", "youcef@example.dz" };
        var customerIds = new List<string>();
        foreach (var email in customerEmails)
        {
            var c = await userRepo.GetByEmailAsync(email);
            if (c == null)
            {
                c = new User
                {
                    FullName = email.Split('@')[0],
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    Phone = $"0555{new System.Random().Next(100000, 999999)}",
                    WilayaCode = new System.Random().Next(1, 69),
                    Role = UserRole.Customer
                };
                await userRepo.InsertAsync(c);
                customerIds.Add(c.Id);
            }
            else customerIds.Add(c.Id);
        }

        // 7. Sample Orders
        var orders = await orderRepo.GetAllAsync();
        if (orders.Count < 6)
        {
            var orderStatuses = new[] { OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Rejected, OrderStatus.Completed, OrderStatus.Pending, OrderStatus.Completed };
            var wilayaCodes = new[] { 16, 31, 25, 6, 19, 1 };
            var wilayaNames = new[] { "الجزائر", "وهران", "قسنطينة", "بجاية", "سطيف", "أدرار" };
            for (int i = 0; i < 6 && i < products.Count; i++)
            {
                var p = products[i];
                var order = new Order
                {
                    Reference = $"3DZ-SEED-{i + 1:D4}",
                    CustomerId = customerIds[i % customerIds.Count],
                    CustomerFullName = customerEmails[i % customerEmails.Length].Split('@')[0],
                    CustomerPhone = $"0555{new System.Random().Next(100000, 999999)}",
                    CustomerEmail = customerEmails[i % customerEmails.Length],
                    WilayaCode = wilayaCodes[i],
                    WilayaName = wilayaNames[i],
                    Items = new List<OrderItem>
                    {
                        new() { ProductId = p.Id, ProductName = p.Name, UnitPrice = p.Price, Quantity = 1 }
                    },
                    SubTotal = p.Price,
                    Total = p.Price,
                    Status = orderStatuses[i],
                    StatusHistory = new List<OrderNote>
                    {
                        new() { Text = $"Order created (seed)", CreatedAt = DateTime.UtcNow.AddDays(-i), AdminId = customerIds[i % customerIds.Count] }
                    },
                    InternalNotes = i == 1 ? new List<OrderNote>
                    {
                        new() { Text = "Customer contacted via phone, agreed to delivery", CreatedAt = DateTime.UtcNow.AddDays(-i + 1), AdminId = admin.Id }
                    } : new(),
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                };
                await orderRepo.InsertAsync(order);
            }
            orders = await orderRepo.GetAllAsync();
        }

        // 8. Sample Reviews
        var reviews = await reviewRepo.GetAllAsync();
        if (reviews.Count == 0 && products.Count >= 4)
        {
            var reviewData = new[]
            {
                (products[0].Id, 5, "منتج رائع جداً، جودة الطباعة ممتازة", customerIds[0]),
                (products[1].Id, 4, "Good model, printed perfectly in PLA", customerIds[1]),
                (products[3].Id, 5, "Modèle super détaillé, impression parfaite", customerIds[2]),
                (products[5].Id, 4, "Excellent rapport qualité-prix", customerIds[3]),
            };
            foreach (var (pid, rating, comment, cid) in reviewData)
            {
                var review = new Review
                {
                    ProductId = pid,
                    CustomerId = cid,
                    CustomerName = (await userRepo.GetByIdAsync(cid))?.FullName ?? "Customer",
                    Rating = rating,
                    Comment = comment,
                    Status = ReviewStatus.Approved
                };
                await reviewRepo.InsertAsync(review);
            }
        }

        // 9. Banner
        var banners = await bannerRepo.GetAllAsync();
        if (banners.Count == 0)
        {
            await bannerRepo.InsertAsync(new Banner
            {
                Title = new LocalizedString("اطبع المستقبل اليوم", "Imprimez l'avenir aujourd'hui", "Manufacturing the Future"),
                Subtitle = new LocalizedString("نموذج ثلاثية الأبعاد لمصممين جزائريين", "Modèles 3D premium pour makers algériens", "Premium 3D models for Algerian makers"),
                ImageUrl = "https://picsum.photos/seed/3ddz-banner/1440/600",
                CtaText = new LocalizedString("اكتشف النماذج", "Découvrir", "Explore Models"),
                LinkUrl = "/explore",
                Active = true,
                SortOrder = 1
            });
        }
    }

    private static List<Wilaya> GetWilayas()
    {
        var list = new List<(int, string, string, string)>
        {
            (1, "أدرار", "Adrar", "Adrar"),
            (2, "الشلف", "Chlef", "Chlef"),
            (3, "الأغواط", "Laghouat", "Laghouat"),
            (4, "أم البواقي", "Oum El Bouaghi", "Oum El Bouaghi"),
            (5, "باتنة", "Batna", "Batna"),
            (6, "بجاية", "Béjaïa", "Bejaia"),
            (7, "بسكرة", "Biskra", "Biskra"),
            (8, "بشار", "Béchar", "Bechar"),
            (9, "البليدة", "Blida", "Blida"),
            (10, "البويرة", "Bouira", "Bouira"),
            (11, "تمنراست", "Tamanrasset", "Tamanrasset"),
            (12, "تبسة", "Tébessa", "Tebessa"),
            (13, "تلمسان", "Tlemcen", "Tlemcen"),
            (14, "تيارت", "Tiaret", "Tiaret"),
            (15, "تيزي وزو", "Tizi Ouzou", "Tizi Ouzou"),
            (16, "الجزائر", "Alger", "Algiers"),
            (17, "الجلفة", "Djelfa", "Djelfa"),
            (18, "جيجل", "Jijel", "Jijel"),
            (19, "سطيف", "Sétif", "Setif"),
            (20, "سعيدة", "Saïda", "Saida"),
            (21, "سكيكدة", "Skikda", "Skikda"),
            (22, "سيدي بلعباس", "Sidi Bel Abbès", "Sidi Bel Abbes"),
            (23, "عنابة", "Annaba", "Annaba"),
            (24, "قالمة", "Guelma", "Guelma"),
            (25, "قسنطينة", "Constantine", "Constantine"),
            (26, "المدية", "Médéa", "Medea"),
            (27, "مستغانم", "Mostaganem", "Mostaganem"),
            (28, "المسيلة", "M'Sila", "Msila"),
            (29, "معسكر", "Mascara", "Mascara"),
            (30, "ورقلة", "Ouargla", "Ouargla"),
            (31, "وهران", "Oran", "Oran"),
            (32, "البيض", "El Bayadh", "El Bayadh"),
            (33, "إليزي", "Illizi", "Illizi"),
            (34, "برج بوعريريج", "Bordj Bou Arréridj", "Bordj Bou Arreridj"),
            (35, "بومرداس", "Boumerdès", "Boumerdes"),
            (36, "الطارف", "El Taref", "El Taref"),
            (37, "تندوف", "Tindouf", "Tindouf"),
            (38, "تيسمسيلت", "Tissemsilt", "Tissemsilt"),
            (39, "الوادي", "El Oued", "El Oued"),
            (40, "خنشلة", "Khenchela", "Khenchela"),
            (41, "سوق أهراس", "Souk Ahras", "Souk Ahras"),
            (42, "تيبازة", "Tipaza", "Tipaza"),
            (43, "ميلة", "Mila", "Mila"),
            (44, "عين الدفلى", "Aïn Defla", "Ain Defla"),
            (45, "النعامة", "Naâma", "Naama"),
            (46, "عين تموشنت", "Aïn Témouchent", "Ain Temouchent"),
            (47, "غرداية", "Ghardaïa", "Ghardaia"),
            (48, "غليزان", "Relizane", "Relizane"),
            (49, "تيميمون", "Timimoun", "Timimoun"),
            (50, "برج باجي مختار", "Bordj Badji Mokhtar", "Bordj Badji Mokhtar"),
            (51, "أولاد جلال", "Ouled Djellal", "Ouled Djellal"),
            (52, "بني عباس", "Béni Abbès", "Beni Abbes"),
            (53, "إن صالح", "In Salah", "In Salah"),
            (54, "إن قزام", "In Guezzam", "In Guezzam"),
            (55, "توقرت", "Touggourt", "Touggourt"),
            (56, "جانت", "Djanet", "Djanet"),
            (57, "المغير", "El M'Ghair", "El Mghair"),
            (58, "المنيعة", "El Meniaa", "El Meniaa"),
            (59, "أفلو", "Aflou", "Aflou"),
            (60, "بريكة", "Barika", "Barika"),
            (61, "القنطرة", "El Kantara", "El Kantara"),
            (62, "بئر العاتر", "Bir El Ater", "Bir El Ater"),
            (63, "العريشة", "Aïn El Aricha", "Ain El Aricha"),
            (64, "قصر الشلالة", "Ksar El Chellala", "Ksar El Chellala"),
            (65, "عين وسارة", "Aïn Oussara", "Ain Oussara"),
            (66, "مسعد", "Messaâd", "Messaaad"),
            (67, "قصر البخاري", "Ksar El Boukhari", "Ksar El Boukhari"),
            (68, "بوسعادة", "Bou Saâda", "Bou Saada"),
            (69, "الأبيض سيدي الشيخ", "El Abiodh Sidi Cheikh", "El Abiodh Sidi Cheikh"),
        };
        return list.Select(x => new Wilaya { Code = x.Item1, Name = new LocalizedString(x.Item2, x.Item3, x.Item4) }).ToList();
    }

    private static List<Category> GetCategoryData()
    {
        return new List<Category>
        {
            new() { Slug = "home-decor", Name = new("ديكور المنزل", "Décoration intérieure", "Home Decor"), Description = new("قطع ديكور ثلاثية الأبعاد للمنزل", "Pièces de décoration 3D pour la maison", "3D printed home decoration pieces"), SortOrder = 1 },
            new() { Slug = "gadgets-tools", Name = new("أدوات وإكسسوارات", "Gadgets & Outils", "Gadgets & Tools"), Description = new("أدوات عملية ومفيدة", "Outils pratiques et utiles", "Practical and useful tools"), SortOrder = 2 },
            new() { Slug = "toys-games", Name = new("ألعاب وتسلية", "Jeux & Jouets", "Toys & Games"), Description = new("ألعاب أطفال وألغاز ثلاثية الأبعاد", "Jeux et puzzles 3D pour enfants", "Kids toys and 3D puzzles"), SortOrder = 3 },
            new() { Slug = "cosplay-props", Name = new("كوزبلاي وإكسسوارات", "Cosplay & Accessoires", "Cosplay & Props"), Description = new("قطع كوزبلاي ودعائم تصوير", "Pièces de cosplay et accessoires", "Cosplay pieces and props"), SortOrder = 4 },
            new() { Slug = "miniatures", Name = new("مجسمات مصغرة", "Miniatures", "Miniatures"), Description = new("مجسمات مصغرة لشخصيات ومباني", "Miniatures de personnages et bâtiments", "Character and building miniatures"), SortOrder = 5 },
            new() { Slug = "mechanical-parts", Name = new("أجزاء ميكانيكية", "Pièces mécaniques", "Mechanical Parts"), Description = new("أجزاء وقطع غيار قابلة للطباعة", "Pièces de rechange imprimables", "Printable replacement parts"), SortOrder = 6 },
            new() { Slug = "jewelry", Name = new("مجوهرات وإكسسوارات", "Bijouterie & Accessoires", "Jewelry"), Description = new("مجوهرات وإكسسوارات أنيقة", "Bijoux et accessoires élégants", "Elegant jewelry and accessories"), SortOrder = 7 },
            new() { Slug = "educational", Name = new("نماذج تعليمية", "Modèles éducatifs", "Educational Models"), Description = new("نماذج تعليمية للعلوم والتكنولوجيا", "Modèles éducatifs STEM", "STEM educational models"), SortOrder = 8 },
            new() { Slug = "keychains", Name = new("سلاسل مفاتيح", "Porte-clés", "Keychains"), Description = new("سلاسل مفاتيح مخصصة", "Porte-clés personnalisés", "Custom keychains"), SortOrder = 9 },
            new() { Slug = "lamp-shades", Name = new("أباجورات وإضاءة", "Abat-jour & Éclairage", "Lamps & Lighting"), Description = new("أباجورات وتصاميم إضاءة فنية", "Abat-jour et designs d'éclairage artistiques", "Artistic lampshades and lighting designs"), SortOrder = 10 },
        };
    }

    private static List<Collection> GetCollectionData(List<Category> categories)
    {
        return new List<Collection>
        {
            new() { Slug = "starter-pack", Name = new("باك البداية", "Pack Débutant", "Starter Pack"), Description = new("مجموعة مشاريع سهلة للمبتدئين في الطباعة ثلاثية الأبعاد", "Projets faciles pour débutants en impression 3D", "Easy projects for 3D printing beginners"), CategoryIds = categories.Select(c => c.Id).Take(4).ToList() },
            new() { Slug = "best-sellers", Name = new("الأكثر مبيعاً", "Meilleures ventes", "Best Sellers"), Description = new("أشهر النماذج وأكثرها طلباً", "Les modèles les plus populaires", "The most popular and requested models"), CategoryIds = categories.Select(c => c.Id).Skip(2).Take(4).ToList() },
            new() { Slug = "new-arrivals", Name = new("وصل حديثاً", "Nouveautés", "New Arrivals"), Description = new("أحدث النماذج المضافة للمنصة", "Les derniers modèles ajoutés", "Latest models added to the platform"), CategoryIds = categories.Select(c => c.Id).Skip(5).ToList() },
        };
    }

    private static List<Product> GetProductData(List<Category> categories)
    {
        var catDict = categories.ToDictionary(c => c.Slug, c => c.Id);
        var rng = new Random(42);
        var products = new List<Product>
        {
            new() { Name = new("مزهرية حلزونية", "Vase Spirale", "Spiral Vase"), Description = new("مزهرية بتصميم حلزوني أنيق", "Vase élégant au design en spirale", "Elegant spiral-designed vase"), CategoryId = catDict["home-decor"], Price = 1500m, Images = new List<string> { "https://picsum.photos/seed/vase1/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 15.2m, IsFeatured = true },
            new() { Name = new("حامل قلم مكتبي", "Porte-stylo de bureau", "Desk Pen Holder"), Description = new("حامل قلم عصري لمكتبك", "Support de stylo moderne pour votre bureau", "Modern pen holder for your desk"), CategoryId = catDict["home-decor"], Price = 800m, Images = new List<string> { "https://picsum.photos/seed/penholder1/800/800" }, FileFormats = new List<string> { "STL" }, FileSizeMb = 4.5m, IsFeatured = true },
            new() { Name = new("حامل هاتف", "Support téléphone", "Phone Stand"), Description = new("حامل هاتف قابل للتعديل", "Support de téléphone ajustable", "Adjustable phone stand"), CategoryId = catDict["gadgets-tools"], Price = 600m, Images = new List<string> { "https://picsum.photos/seed/phonestand1/800/800" }, FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 3.1m, IsFeatured = true },
            new() { Name = new("مكعب ألغاز", "Cube Puzzle", "Puzzle Cube"), Description = new("مكعب ألغاز ثلاثي الأبعاد قابل للطباعة", "Cube de puzzle 3D imprimable", "Printable 3D puzzle cube"), CategoryId = catDict["toys-games"], Price = 500m, Images = new List<string> { "https://picsum.photos/seed/cube1/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 8.7m, IsFeatured = true },
            new() { Name = new("قناع خارق", "Masque de super-héros", "Superhero Mask"), Description = new("قناع بطولات قابل للارتداء", "Masque de héros ajustable", "Adjustable hero mask"), CategoryId = catDict["cosplay-props"], Price = 1200m, Images = new List<string> { "https://picsum.photos/seed/mask1/800/800" }, FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 22.4m },
            new() { Name = new("تمثال تنين صغير", "Petite statue de dragon", "Dragon Miniature"), Description = new("تمثال تنين مفصّل بحجم 10 سم", "Statue de dragon détaillée 10cm", "Detailed 10cm dragon statue"), CategoryId = catDict["miniatures"], Price = 2500m, Images = new List<string> { "https://picsum.photos/seed/dragon1/800/800" }, FileFormats = new List<string> { "STL", "OBJ", "3MF" }, FileSizeMb = 45.3m, IsFeatured = true },
            new() { Name = new("مشبك كابل", "Clip pour câble", "Cable Clip"), Description = new("مشبك لتنظيم الكابلات والأسلاك", "Clip pour organiser les câbles", "Clip for cable management"), CategoryId = catDict["mechanical-parts"], Price = 200m, Images = new List<string> { "https://picsum.photos/seed/clip1/800/800" }, FileFormats = new List<string> { "STL" }, FileSizeMb = 0.8m },
            new() { Name = new("خاتم حلزوني", "Bague Spirale", "Spiral Ring"), Description = new("خاتم بتصميم حلزوني أنيق", "Bague au design spiralé élégant", "Elegant spiral-designed ring"), CategoryId = catDict["jewelry"], Price = 350m, Images = new List<string> { "https://picsum.photos/seed/ring1/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 1.2m, IsFeatured = true },
            new() { Name = new("مجموعة أقراط", "Ensemble de boucles d'oreilles", "Earring Set"), Description = new("مجموعة أقراط هندسية", "Ensemble de boucles d'oreilles géométriques", "Geometric earring set"), CategoryId = catDict["jewelry"], Price = 450m, Images = new List<string> { "https://picsum.photos/seed/earrings1/800/800" }, FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 0.9m },
            new() { Name = new("مجسم ذرة", "Modèle d'atome", "Atom Model"), Description = new("مجسم تعليمي لذرة الكربون", "Modèle éducatif d'atome de carbone", "Educational carbon atom model"), CategoryId = catDict["educational"], Price = 900m, Images = new List<string> { "https://picsum.photos/seed/atom1/800/800" }, FileFormats = new List<string> { "STL" }, FileSizeMb = 6.4m },
            new() { Name = new("مجموعة ترس", "Engrenage Set", "Gear Set STEM"), Description = new("مجموعة تروس تعليمية", "Ensemble d'engrenages éducatif", "Educational gear set"), CategoryId = catDict["educational"], Price = 1800m, Images = new List<string> { "https://picsum.photos/seed/gears1/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 12.7m, IsFeatured = true },
            new() { Name = new("مفتاح الجزائر", "Porte-clés Algérie", "Algeria Keychain"), Description = new("سلسلة مفاتيح على شكل خريطة الجزائر", "Porte-clés en forme de carte d'Algérie", "Algeria map shaped keychain"), CategoryId = catDict["keychains"], Price = 300m, Images = new List<string> { "https://picsum.photos/seed/algeria-kc/800/800" }, FileFormats = new List<string> { "STL" }, FileSizeMb = 2.1m },
            new() { Name = new("مفتاح برج المقرية", "Porte-clés Tour de la Maurétanie", "Maurétania Tower Keychain"), Description = new("سلسلة مفاتيح برج المقرية", "Porte-clés tour de la Maurétanie", "Maurétania tower keychain"), CategoryId = catDict["keychains"], Price = 350m, Images = new List<string> { "https://picsum.photos/seed/tower-kc/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 3.5m },
            new() { Name = new("أباجورة هندسية", "Lampe géométrique", "Geometric Lamp"), Description = new("أباجورة بتصميم هندسي حديث", "Lampe au design géométrique moderne", "Modern geometric design lamp"), CategoryId = catDict["lamp-shades"], Price = 3200m, Images = new List<string> { "https://picsum.photos/seed/lamp1/800/800" }, FileFormats = new List<string> { "STL", "OBJ", "3MF" }, FileSizeMb = 35.1m, IsFeatured = true },
            new() { Name = new("غطاء أباجورة عثماني", "Abat-jour ottoman", "Ottoman Lampshade"), Description = new("غطاء أباجورة بتصميم عثماني تقليدي", "Abat-jour au design ottoman traditionnel", "Traditional Ottoman design lampshade"), CategoryId = catDict["lamp-shades"], Price = 2800m, Images = new List<string> { "https://picsum.photos/seed/ottoman-lamp/800/800" }, FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 28.6m },
            new() { Name = new("منظم مكتب", "Organiseur de bureau", "Desk Organizer"), Description = new("منظم مكتب متعدد الاستخدامات", "Organiseur de bureau polyvalent", "Multi-purpose desk organizer"), CategoryId = catDict["home-decor"], Price = 1500m, Images = new List<string> { "https://picsum.photos/seed/organizer1/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 18.2m, IsFeatured = true },
            new() { Name = new("طائرة لعبة", "Avion jouet", "Toy Plane"), Description = new("طائرة لعبة قابلة للتجميع", "Avion jouet à assembler", "Assembleable toy plane"), CategoryId = catDict["toys-games"], Price = 1100m, Images = new List<string> { "https://picsum.photos/seed/plane1/800/800" }, FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 14.3m },
            new() { Name = new("قطع شطرنج", "Pièces d'échecs", "Chess Pieces"), Description = new("مجموعة قطع شطرنج كلاسيكية كاملة", "Jeu d'échecs classique complet", "Full classic chess set"), CategoryId = catDict["toys-games"], Price = 2000m, Images = new List<string> { "https://picsum.photos/seed/chess1/800/800" }, FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 25.8m, IsFeatured = true },
        };
        foreach (var p in products)
        {
            p.Slug = p.Name.En.ToLowerInvariant().Replace(" ", "-") + $"-{rng.Next(10000, 99999)}";
            p.Images = p.Images.Count > 0 ? p.Images : new List<string> { $"https://picsum.photos/seed/{Guid.NewGuid().ToString("N")[..8]}/800/800" };
        }
        return products;
    }
}
