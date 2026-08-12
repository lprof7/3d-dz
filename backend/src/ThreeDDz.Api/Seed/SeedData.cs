using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;
using ThreeDDz.Infrastructure.Repositories;

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

        // 3. Categories, Collections & Products (v2 seed: only Accessories + Car Parts)
        var carPartsCat = await catRepo.GetBySlugAsync("car-parts");
        var accessoriesCat = await catRepo.GetBySlugAsync("accessories");
        List<Category> cats;
        List<Product> products;
        if (carPartsCat == null || accessoriesCat == null)
        {
            // Reset catalog: wipe old products, collections and categories, then seed fresh
            foreach (var p in await prodRepo.GetAllAsync()) await prodRepo.DeleteAsync(p.Id);
            foreach (var col in await colRepo.GetAllAsync()) await colRepo.DeleteAsync(col.Id);
            foreach (var c in await catRepo.GetAllAsync()) await catRepo.DeleteAsync(c.Id);

            var categoryData = GetCategoryData();
            foreach (var c in categoryData) await catRepo.InsertAsync(c);
            cats = await catRepo.GetAllAsync();

            var collectionData = GetCollectionData(cats);
            foreach (var c in collectionData) await colRepo.InsertAsync(c);

            var productData = GetProductData(cats);
            foreach (var p in productData) await prodRepo.InsertAsync(p);
            products = await prodRepo.GetAllAsync();
        }
        else
        {
            cats = await catRepo.GetAllAsync();
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
                LinkUrl = "/catalog",
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
            new() { Slug = "accessories", Name = new("إكسسوارات", "Accessoires", "Accessories"), Description = new("إكسسوارات عملية ثلاثية الأبعاد", "Accessoires pratiques imprimés en 3D", "Practical 3D printed accessories"), SortOrder = 1 },
            new() { Slug = "car-parts", Name = new("قطع السيارات", "Pièces auto", "Car Parts"), Description = new("قطع وإكسسوارات سيارات قابلة للطباعة", "Pièces et accessoires auto imprimables", "Printable car parts and accessories"), SortOrder = 2 },
        };
    }

    private static List<Collection> GetCollectionData(List<Category> categories)
    {
        var all = categories.Select(c => c.Id).ToList();
        return new List<Collection>
        {
            new() { Slug = "best-sellers", Name = new("الأكثر مبيعاً", "Meilleures ventes", "Best Sellers"), Description = new("أشهر النماذج وأكثرها طلباً", "Les modèles les plus populaires", "The most popular and requested models"), CategoryIds = all },
            new() { Slug = "new-arrivals", Name = new("وصل حديثاً", "Nouveautés", "New Arrivals"), Description = new("أحدث النماذج المضافة للمنصة", "Les derniers modèles ajoutés", "Latest models added to the platform"), CategoryIds = all },
        };
    }

    private static List<Product> GetProductData(List<Category> categories)
    {
        var catDict = categories.ToDictionary(c => c.Slug, c => c.Id);
        var rng = new Random(42);
        var products = new List<Product>
        {
            new() { Name = new("حامل هاتف قابل للتعديل", "Support téléphone ajustable", "Adjustable Phone Stand"), Description = new("حامل هاتف عملي قابل للتعديل", "Support de téléphone pratique et ajustable", "Practical adjustable phone stand"), CategoryId = catDict["accessories"], Price = 600m, Images = Imgs("phone-stand"), FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 3.1m, IsFeatured = true },
            new() { Name = new("سلسلة مفاتيح الجزائر", "Porte-clés Algérie", "Algeria Keychain"), Description = new("سلسلة مفاتيح على شكل خريطة الجزائر", "Porte-clés en forme de carte d'Algérie", "Algeria map shaped keychain"), CategoryId = catDict["accessories"], Price = 300m, Images = Imgs("algeria-kc"), FileFormats = new List<string> { "STL" }, FileSizeMb = 2.1m },
            new() { Name = new("حامل قلم مكتبي", "Porte-stylo de bureau", "Desk Pen Holder"), Description = new("حامل قلم عصري لمكتبك", "Support de stylo moderne pour votre bureau", "Modern pen holder for your desk"), CategoryId = catDict["accessories"], Price = 800m, Images = Imgs("pen-holder"), FileFormats = new List<string> { "STL" }, FileSizeMb = 4.5m, IsFeatured = true },
            new() { Name = new("منظم مكتب", "Organiseur de bureau", "Desk Organizer"), Description = new("منظم مكتب متعدد الاستخدامات", "Organiseur de bureau polyvalent", "Multi-purpose desk organizer"), CategoryId = catDict["accessories"], Price = 1500m, Images = Imgs("desk-organizer"), FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 18.2m, IsFeatured = true },
            new() { Name = new("مشبك كابل", "Clip pour câble", "Cable Clip"), Description = new("مشبك لتنظيم الكابلات والأسلاك", "Clip pour organiser les câbles", "Clip for cable management"), CategoryId = catDict["accessories"], Price = 200m, Images = Imgs("cable-clip"), FileFormats = new List<string> { "STL" }, FileSizeMb = 0.8m },
            new() { Name = new("حامل سماعات رأس", "Support casque", "Headphone Stand"), Description = new("حامل أنيق لسماعات الرأس", "Support élégant pour casque", "Elegant headphone stand"), CategoryId = catDict["accessories"], Price = 1300m, Images = Imgs("headphone-stand"), FileFormats = new List<string> { "STL" }, FileSizeMb = 9.6m, IsFeatured = true },

            new() { Name = new("حامل هاتف للسيارة", "Support téléphone voiture", "Car Phone Mount"), Description = new("حامل هاتف ثابت للوحة القيادة", "Support de téléphone pour tableau de bord", "Dash mount phone holder"), CategoryId = catDict["car-parts"], Price = 1200m, Images = Imgs("car-phone-mount"), FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 5.4m, IsFeatured = true },
            new() { Name = new("غطاء حافة عجلة", "Enjoliveur de roue", "Wheel Hub Cap"), Description = new("غطاء حافة عجلة قابل للطباعة", "Enjoliveur de roue imprimable", "Printable wheel hub cap"), CategoryId = catDict["car-parts"], Price = 2500m, Images = Imgs("wheel-hub-cap"), FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 34.2m },
            new() { Name = new("موزع هواء لفتحات المكيف", "Diffuseur d'air de clim", "AC Vent Air Diffuser"), Description = new("موزع هواء لفتحات التكييف", "Diffuseur d'air pour ventilation", "Air diffuser for AC vents"), CategoryId = catDict["car-parts"], Price = 900m, Images = Imgs("ac-diffuser"), FileFormats = new List<string> { "STL" }, FileSizeMb = 7.8m },
            new() { Name = new("حامل فنجان للسيارة", "Support gobelet voiture", "Car Cup Holder Insert"), Description = new("حامل فنجان متناسق مع الكونسول", "Support de gobelet pour console", "Console compatible cup holder"), CategoryId = catDict["car-parts"], Price = 750m, Images = Imgs("cup-holder"), FileFormats = new List<string> { "STL" }, FileSizeMb = 6.2m, IsFeatured = true },
            new() { Name = new("غطاء مقبض الباب", "Cache poignée de porte", "Door Handle Cover"), Description = new("غطاء مقبض باب خارجي", "Cache de poignée de porte extérieure", "Exterior door handle cover"), CategoryId = catDict["car-parts"], Price = 1100m, Images = Imgs("door-handle-cover"), FileFormats = new List<string> { "STL", "OBJ" }, FileSizeMb = 12.4m },
            new() { Name = new("منظم صندوق الأدوات", "Organiseur de coffre", "Tool Box Organizer"), Description = new("منظم متعدد الحجرات لصندوق الأدوات", "Organiseur à plusieurs compartiments", "Multi-compartment tool box organizer"), CategoryId = catDict["car-parts"], Price = 1800m, Images = Imgs("toolbox-organizer"), FileFormats = new List<string> { "STL", "3MF" }, FileSizeMb = 21.7m },
            new() { Name = new("إطار لوحة الأرقام", "Cadre de plaque", "License Plate Frame"), Description = new("إطار لوحة أرقام أنيق قابل للطباعة", "Cadre de plaque d'immatriculation imprimable", "Printable license plate frame"), CategoryId = catDict["car-parts"], Price = 650m, Images = Imgs("plate-frame"), FileFormats = new List<string> { "STL" }, FileSizeMb = 4.9m },
        };
        foreach (var p in products)
        {
            p.Slug = p.Name.En.ToLowerInvariant().Replace(" ", "-") + $"-{rng.Next(10000, 99999)}";
            p.Images = p.Images.Count > 0 ? p.Images : new List<string> { $"https://picsum.photos/seed/{Guid.NewGuid().ToString("N")[..8]}/800/800" };
        }
        return products;
    }

    private static List<string> Imgs(string seed) => seed switch
    {
        "phone-stand" => new()
        {
            "https://m.media-amazon.com/images/I/61BdKHo7ymL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/61Dsa0PfOPL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/61-eVGnnwGL._AC_SL1500_.jpg",
        },
        "headphone-stand" => new()
        {
            "https://m.media-amazon.com/images/I/71uZddgeCNL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/715V6IOUVGL._AC_SL1500_.jpg",
            "https://m.media-amazon.com/images/I/71yiB6rdQJL._AC_SL1500_.jpg",
        },
        "cup-holder" => new()
        {
            "https://m.media-amazon.com/images/I/5173RdpWraL._AC_SL1500_.jpg",
        },
        "algeria-kc" => new()
        {
            "https://live.staticflickr.com/79/237409211_968b489c59_b.jpg",
            "https://live.staticflickr.com/7080/13896885161_79e3c18209_b.jpg",
            "https://live.staticflickr.com/7373/10535109203_ec0fa3ca51_b.jpg",
            "https://live.staticflickr.com/4117/4790710889_6797c0eca1_b.jpg",
        },
        "pen-holder" => new()
        {
            "https://live.staticflickr.com/7328/14137196234_d4fdff6fbf_b.jpg",
            "https://live.staticflickr.com/5226/5653449863_dafec502d6_b.jpg",
            "https://live.staticflickr.com/7088/7167704577_451869e8c1_b.jpg",
            "https://live.staticflickr.com/3858/18882409179_9039cd0e37_b.jpg",
        },
        "desk-organizer" => new()
        {
            "https://live.staticflickr.com/8682/29967923790_6fc2bcc24c_b.jpg",
            "https://live.staticflickr.com/8742/30229628306_cb43c2bc22_b.jpg",
            "https://live.staticflickr.com/5571/29633962454_f089179f54_b.jpg",
            "https://live.staticflickr.com/8547/29633965114_474b883a55_b.jpg",
        },
        "cable-clip" => new()
        {
            "https://live.staticflickr.com/65535/53051045882_b5b487f81f_b.jpg",
            "https://live.staticflickr.com/8370/8375162597_d6c096b8db.jpg",
            "https://live.staticflickr.com/8522/8598977928_ea29b29935_b.jpg",
            "https://live.staticflickr.com/4143/4860536595_fabf65e50d_b.jpg",
        },
        "car-phone-mount" => new()
        {
            "https://live.staticflickr.com/5509/9088259363_d4a26a4fc5_b.jpg",
            "https://live.staticflickr.com/65535/52205479968_031a9d776e_b.jpg",
            "https://live.staticflickr.com/65535/52205961480_6e15cc07fa_b.jpg",
            "https://live.staticflickr.com/65535/52205479548_f87ac071b0_b.jpg",
        },
        "wheel-hub-cap" => new()
        {
            "https://live.staticflickr.com/6203/6095887481_1833e21d99_b.jpg",
            "https://live.staticflickr.com/8305/7993262601_3306b8922c_b.jpg",
            "https://live.staticflickr.com/2942/15220656447_05a3ee408d_b.jpg",
            "https://live.staticflickr.com/4011/4427687123_53c4f82a58_b.jpg",
        },
        "ac-diffuser" => new()
        {
            "https://live.staticflickr.com/148/388165208_f27afca191.jpg",
            "https://live.staticflickr.com/225/514445334_e1b5d0b688.jpg",
            "https://live.staticflickr.com/3683/14315817595_36664e1c8e.jpg",
            "https://live.staticflickr.com/3012/2783749675_8e38c2d9c5_b.jpg",
        },
        "door-handle-cover" => new()
        {
            "https://live.staticflickr.com/4410/36229712510_1072721bee_b.jpg",
            "https://live.staticflickr.com/2804/4316668220_0b27cf03fd_b.jpg",
            "https://live.staticflickr.com/3200/2289072777_035d9f229b_b.jpg",
            "https://live.staticflickr.com/3113/2923557253_436c56d38a_b.jpg",
        },
        "toolbox-organizer" => new()
        {
            "https://live.staticflickr.com/139/337938418_a36c279deb.jpg",
            "https://live.staticflickr.com/129/337938459_52c83dce73.jpg",
            "https://live.staticflickr.com/1/1146677_df64d755b7_b.jpg",
            "https://live.staticflickr.com/3407/4632887921_2d0c7e7b5a_b.jpg",
        },
        "plate-frame" => new()
        {
            "https://live.staticflickr.com/4/5206551_f1ca4c77c4_b.jpg",
            "https://live.staticflickr.com/8224/8383095174_dc6bf836e5_b.jpg",
            "https://live.staticflickr.com/110/362879647_c3d442e71b_b.jpg",
            "https://live.staticflickr.com/65535/49061550236_0e738c4766.jpg",
        },
        _ => new()
        {
            $"https://picsum.photos/seed/{seed}-1/1200/1200",
            $"https://picsum.photos/seed/{seed}-2/1200/1200",
            $"https://picsum.photos/seed/{seed}-3/1200/1200",
        },
    };

    public static async Task EnsureIndexesAsync(IServiceProvider sp, MongoContext mongo)
    {
        var products = mongo.Database.GetCollection<Product>("Products");
        var orders = mongo.Database.GetCollection<Order>("Orders");

        // Text index for product search (name + description in all languages)
        var textKeys = Builders<Product>.IndexKeys
            .Text("name.ar").Text("name.fr").Text("name.en")
            .Text("description.ar").Text("description.fr").Text("description.en");
        var textIndexModel = new CreateIndexModel<Product>(textKeys, new CreateIndexOptions { Name = "product_search_text" });
        try { await products.Indexes.CreateOneAsync(textIndexModel); }
        catch { /* already exists */ }

        // Indexes for order filtering
        var orderStatusIndex = Builders<Order>.IndexKeys.Ascending(o => o.Status).Descending(o => o.CreatedAt);
        var orderStatusIndexModel = new CreateIndexModel<Order>(orderStatusIndex, new CreateIndexOptions { Name = "order_status_created" });
        try { await orders.Indexes.CreateOneAsync(orderStatusIndexModel); }
        catch { }

        var orderCustomerIndex = Builders<Order>.IndexKeys.Ascending(o => o.CustomerId).Descending(o => o.CreatedAt);
        var orderCustomerIndexModel = new CreateIndexModel<Order>(orderCustomerIndex, new CreateIndexOptions { Name = "order_customer_created" });
        try { await orders.Indexes.CreateOneAsync(orderCustomerIndexModel); }
        catch { }

        // Index for product listing
        var productListIndex = Builders<Product>.IndexKeys.Ascending(p => p.IsDeleted).Ascending(p => p.IsPublished).Descending(p => p.CreatedAt);
        var productListIndexModel = new CreateIndexModel<Product>(productListIndex, new CreateIndexOptions { Name = "product_list" });
        try { await products.Indexes.CreateOneAsync(productListIndexModel); }
        catch { }
    }
}
