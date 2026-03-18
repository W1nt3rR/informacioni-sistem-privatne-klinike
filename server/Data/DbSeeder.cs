using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<AppDbContext>();

        // --- Roles ---
        string[] roles = ["admin", "recepcija", "lekar", "menadzer", "pacijent"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // --- Admin User ---
        const string adminUserName = "admin";
        ApplicationUser? adminUser = await userManager.FindByNameAsync(adminUserName);
        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminUserName,
                Email = "admin@clinic.local",
                Ime = "Admin",
                Prezime = "System",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(adminUser, "Admin123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(adminUser, "admin");
        }

        // Skip the rest if data already seeded
        if (await db.Specializations.AnyAsync())
            return;

        // --- Specializations ---
        var specOpsta = new Specialization { Naziv = "Opšta medicina", Opis = "Opšta medicinska praksa" };
        var specKardio = new Specialization { Naziv = "Kardiologija", Opis = "Bolesti srca i krvnih sudova" };
        var specDerma = new Specialization { Naziv = "Dermatologija", Opis = "Bolesti kože" };
        var specOrtop = new Specialization { Naziv = "Ortopedija", Opis = "Bolesti koštano-zglobnog sistema" };
        var specNeuro = new Specialization { Naziv = "Neurologija", Opis = "Bolesti nervnog sistema" };
        var specORL = new Specialization { Naziv = "Otorinolaringologija", Opis = "Bolesti uha, grla i nosa" };
        db.Specializations.AddRange(specOpsta, specKardio, specDerma, specOrtop, specNeuro, specORL);
        await db.SaveChangesAsync();

        // --- Diagnoses (ICD-10 subset) ---
        var diagnoses = new[]
        {
            new Diagnosis { Sifra = "J06.9", Naziv = "Akutna infekcija gornjeg respiratornog trakta", Opis = "Prehlada" },
            new Diagnosis { Sifra = "I10", Naziv = "Esencijalna hipertenzija", Opis = "Visok krvni pritisak" },
            new Diagnosis { Sifra = "E11", Naziv = "Dijabetes melitus tip 2", Opis = "Šećerna bolest" },
            new Diagnosis { Sifra = "M54.5", Naziv = "Bol u donjem delu leđa", Opis = "Lumbago" },
            new Diagnosis { Sifra = "L20", Naziv = "Atopijski dermatitis", Opis = "Ekcem" },
            new Diagnosis { Sifra = "G43", Naziv = "Migrena", Opis = "Hronična glavobolja" },
            new Diagnosis { Sifra = "J45", Naziv = "Astma", Opis = "Hronična bolest disajnih puteva" },
            new Diagnosis { Sifra = "K21", Naziv = "Gastroezofagealna refluksna bolest", Opis = "GERB" },
            new Diagnosis { Sifra = "M75", Naziv = "Lezije ramena", Opis = "Oštećenja ramenog zgloba" },
            new Diagnosis { Sifra = "H65", Naziv = "Upala srednjeg uha", Opis = "Otitis media" },
        };
        db.Diagnoses.AddRange(diagnoses);
        await db.SaveChangesAsync();

        // --- Services ---
        var svcOpsti = new Service { Naziv = "Opšti pregled", Opis = "Početni opšti lekarski pregled", TrajanjeMinuta = 30, Cena = 3000m, SpecializationId = specOpsta.SpecializationId };
        var svcKardio = new Service { Naziv = "Kardiološki pregled", Opis = "Pregled kardiologa sa EKG-om", TrajanjeMinuta = 45, Cena = 5000m, SpecializationId = specKardio.SpecializationId };
        var svcEKG = new Service { Naziv = "EKG", Opis = "Elektrokardiogram", TrajanjeMinuta = 15, Cena = 2000m, SpecializationId = specKardio.SpecializationId };
        var svcDerma = new Service { Naziv = "Dermatološki pregled", Opis = "Pregled kože", TrajanjeMinuta = 30, Cena = 4000m, SpecializationId = specDerma.SpecializationId };
        var svcDermoskop = new Service { Naziv = "Dermoskopija", Opis = "Pregled mladeža dermoskopom", TrajanjeMinuta = 20, Cena = 3500m, SpecializationId = specDerma.SpecializationId };
        var svcOrtop = new Service { Naziv = "Ortopedski pregled", Opis = "Pregled ortopeda", TrajanjeMinuta = 30, Cena = 4500m, SpecializationId = specOrtop.SpecializationId };
        var svcNeuro = new Service { Naziv = "Neurološki pregled", Opis = "Pregled neurologa", TrajanjeMinuta = 45, Cena = 5500m, SpecializationId = specNeuro.SpecializationId };
        var svcORL = new Service { Naziv = "ORL pregled", Opis = "Pregled uha, grla i nosa", TrajanjeMinuta = 30, Cena = 4000m, SpecializationId = specORL.SpecializationId };
        db.Services.AddRange(svcOpsti, svcKardio, svcEKG, svcDerma, svcDermoskop, svcOrtop, svcNeuro, svcORL);
        await db.SaveChangesAsync();

        // --- Offices ---
        var office1 = new Office { Naziv = "Ordinacija 1", Lokacija = "Prizemlje, levo", Oprema = "EKG aparat, stetoskop" };
        var office2 = new Office { Naziv = "Ordinacija 2", Lokacija = "Prizemlje, desno", Oprema = "Dermoskop, lupa" };
        var office3 = new Office { Naziv = "Ordinacija 3", Lokacija = "Sprat 1", Oprema = "Rendgen, UZ" };
        var office4 = new Office { Naziv = "Ordinacija 4", Lokacija = "Sprat 1", Oprema = "EEG aparat" };
        db.Offices.AddRange(office1, office2, office3, office4);
        await db.SaveChangesAsync();

        // --- Receptionist User ---
        var recepUser = new ApplicationUser
        {
            UserName = "recepcija1",
            Email = "recepcija@clinic.local",
            Ime = "Amina",
            Prezime = "Hadžović",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(recepUser, "Recep123");
        await userManager.AddToRoleAsync(recepUser, "recepcija");

        // --- Manager User ---
        var mgrUser = new ApplicationUser
        {
            UserName = "menadzer1",
            Email = "menadzer@clinic.local",
            Ime = "Emir",
            Prezime = "Muratović",
            EmailConfirmed = true
        };
        await userManager.CreateAsync(mgrUser, "Menad123");
        await userManager.AddToRoleAsync(mgrUser, "menadzer");

        // --- Doctor Users + Doctor records ---
        async Task<Doctor> CreateDoctor(string username, string email, string ime, string prezime,
            string titula, string licenca, Specialization spec)
        {
            var user = new ApplicationUser
            {
                UserName = username, Email = email, Ime = ime, Prezime = prezime, EmailConfirmed = true
            };
            await userManager.CreateAsync(user, "Lekar123");
            await userManager.AddToRoleAsync(user, "lekar");
            var doctor = new Doctor
            {
                UserId = user.Id,
                SpecializationId = spec.SpecializationId,
                Titula = titula,
                LicencaBroj = licenca
            };
            db.Doctors.Add(doctor);
            await db.SaveChangesAsync();
            return doctor;
        }

        var drAmir = await CreateDoctor("dramir", "amir@clinic.local", "Amir", "Dizdarević",
            "dr", "LIC-001", specOpsta);
        var drLejla = await CreateDoctor("drlejla", "lejla@clinic.local", "Lejla", "Kurtović",
            "dr", "LIC-002", specKardio);
        var drHaris = await CreateDoctor("drharis", "haris@clinic.local", "Haris", "Bihorac",
            "dr", "LIC-003", specDerma);
        var drAmra = await CreateDoctor("dramra", "amra@clinic.local", "Amra", "Softić",
            "dr", "LIC-004", specOrtop);
        var drAdnan = await CreateDoctor("dradnan", "adnan@clinic.local", "Adnan", "Fetahović",
            "dr", "LIC-005", specNeuro);

        // --- Doctor-Service links ---
        db.DoctorServices.AddRange(
            new DoctorService { DoctorId = drAmir.DoctorId, ServiceId = svcOpsti.ServiceId },
            new DoctorService { DoctorId = drLejla.DoctorId, ServiceId = svcKardio.ServiceId },
            new DoctorService { DoctorId = drLejla.DoctorId, ServiceId = svcEKG.ServiceId },
            new DoctorService { DoctorId = drHaris.DoctorId, ServiceId = svcDerma.ServiceId },
            new DoctorService { DoctorId = drHaris.DoctorId, ServiceId = svcDermoskop.ServiceId },
            new DoctorService { DoctorId = drAmra.DoctorId, ServiceId = svcOrtop.ServiceId },
            new DoctorService { DoctorId = drAdnan.DoctorId, ServiceId = svcNeuro.ServiceId }
        );
        await db.SaveChangesAsync();

        // --- Working Hours (Mon-Fri 08:00-16:00 for all doctors) ---
        foreach (var doc in new[] { drAmir, drLejla, drHaris, drAmra, drAdnan })
        {
            for (int day = 1; day <= 5; day++)
            {
                db.WorkingHours.Add(new WorkingHours
                {
                    DoctorId = doc.DoctorId,
                    DanUNedelji = day,
                    VremeOd = new TimeOnly(8, 0),
                    VremeDo = new TimeOnly(16, 0)
                });
            }
        }
        await db.SaveChangesAsync();

        // --- Non-Working Days ---
        var year = DateTime.UtcNow.Year;
        db.NonWorkingDays.AddRange(
            new NonWorkingDay { Datum = new DateOnly(year, 1, 1), Naziv = "Nova godina" },
            new NonWorkingDay { Datum = new DateOnly(year, 1, 2), Naziv = "Nova godina (drugi dan)" },
            new NonWorkingDay { Datum = new DateOnly(year, 2, 15), Naziv = "Sretenje - Dan državnosti" },
            new NonWorkingDay { Datum = new DateOnly(year, 3, 30), Naziv = "Ramazanski bajram" },
            new NonWorkingDay { Datum = new DateOnly(year, 3, 31), Naziv = "Ramazanski bajram (drugi dan)" },
            new NonWorkingDay { Datum = new DateOnly(year, 5, 1), Naziv = "Praznik rada" },
            new NonWorkingDay { Datum = new DateOnly(year, 6, 6), Naziv = "Kurban bajram" },
            new NonWorkingDay { Datum = new DateOnly(year, 6, 7), Naziv = "Kurban bajram (drugi dan)" },
            new NonWorkingDay { Datum = new DateOnly(year, 11, 11), Naziv = "Dan primirja" }
        );
        await db.SaveChangesAsync();

        // --- Patients ---
        var pat1 = new Patient { Ime = "Edin", Prezime = "Mujović", JMBG = "0101990710001", DatumRodjenja = new DateOnly(1990, 1, 1), Pol = "M", Telefon = "0641234567", Email = "edin.mujovic@email.com", Adresa = "28. Novembra 15, Novi Pazar" };
        var pat2 = new Patient { Ime = "Azra", Prezime = "Kolašinac", JMBG = "1505985735002", DatumRodjenja = new DateOnly(1985, 5, 15), Pol = "Ž", Telefon = "0659876543", Email = "azra.kolasinac@email.com", Adresa = "Rifata Burdževića 8, Novi Pazar" };
        var pat3 = new Patient { Ime = "Senad", Prezime = "Ljajić", JMBG = "2003978710003", DatumRodjenja = new DateOnly(1978, 3, 20), Pol = "M", Telefon = "0621112233", Email = "senad.ljajic@email.com", Adresa = "Stevana Nemanje 42, Novi Pazar", JePenzioner = true };
        var pat4 = new Patient { Ime = "Merima", Prezime = "Redžović", JMBG = "0812000735004", DatumRodjenja = new DateOnly(2000, 12, 8), Pol = "Ž", Telefon = "0634445566", Email = "merima.redzovic@email.com", Adresa = "1. maja 30, Novi Pazar", JeStudent = true };
        var pat5 = new Patient { Ime = "Hasan", Prezime = "Hodžić", JMBG = "3006995710005", DatumRodjenja = new DateOnly(1995, 6, 30), Pol = "M", Telefon = "0607778899", Email = "hasan.hodzic@email.com", Adresa = "Oslobodilačka 12, Novi Pazar", BrojOsiguranja = "123456789" };
        db.Patients.AddRange(pat1, pat2, pat3, pat4, pat5);
        await db.SaveChangesAsync();

        // --- Allergies ---
        db.Allergies.AddRange(
            new Allergy { PatientId = pat1.PatientId, NazivAlergena = "Penicilin", Ozbiljnost = "teska", Opis = "Anafilaktička reakcija" },
            new Allergy { PatientId = pat2.PatientId, NazivAlergena = "Polen", Ozbiljnost = "umerena", Opis = "Sezonski alergijski rinitis" },
            new Allergy { PatientId = pat3.PatientId, NazivAlergena = "Aspirin", Ozbiljnost = "blaga", Opis = "Kožni osip" }
        );
        await db.SaveChangesAsync();

        // --- Discounts (system discounts – cannot be deleted) ---
        if (!await db.Discounts.AnyAsync(d => d.JeSistemski))
        {
            db.Discounts.AddRange(
                new Discount { Naziv = "Popust za studente", Tip = "student", Procenat = 15m, Aktivan = true, JeSistemski = true },
                new Discount { Naziv = "Penzionerski popust", Tip = "penzioner", Procenat = 10m, Aktivan = true, JeSistemski = true },
                new Discount { Naziv = "Paket 2 stavke", Tip = "paket2", Procenat = 5m, Aktivan = true, JeSistemski = true },
                new Discount { Naziv = "Paket 3+ stavke", Tip = "paket3", Procenat = 10m, Aktivan = true, JeSistemski = true },
                new Discount { Naziv = "Opšti popust", Tip = "opsti", Procenat = 0m, Aktivan = true, JeSistemski = true }
            );
            await db.SaveChangesAsync();
        }
        if (!await db.Discounts.AnyAsync(d => d.Kod == "KLINIKA10"))
        {
            db.Discounts.Add(new Discount { Naziv = "Promo kod KLINIKA10", Tip = "kod", Procenat = 10m, Aktivan = true, JeSistemski = false, Kod = "KLINIKA10" });
            await db.SaveChangesAsync();
        }

        // --- Appointments (future and past) ---
        var now = DateTime.UtcNow;
        var nextMon = now.AddDays((8 - (int)now.DayOfWeek) % 7);
        if (nextMon <= now) nextMon = nextMon.AddDays(7);
        nextMon = new DateTime(nextMon.Year, nextMon.Month, nextMon.Day, 9, 0, 0, DateTimeKind.Utc);

        var creatorId = adminUser!.Id;

        // Future appointments
        db.Appointments.AddRange(
            new Appointment { PatientId = pat1.PatientId, DoctorId = drAmir.DoctorId, ServiceId = svcOpsti.ServiceId, OfficeId = office1.OfficeId, DatumVreme = nextMon, TrajanjeMinuta = 30, CreatorId = creatorId },
            new Appointment { PatientId = pat2.PatientId, DoctorId = drLejla.DoctorId, ServiceId = svcKardio.ServiceId, OfficeId = office1.OfficeId, DatumVreme = nextMon.AddHours(1), TrajanjeMinuta = 45, CreatorId = creatorId },
            new Appointment { PatientId = pat3.PatientId, DoctorId = drHaris.DoctorId, ServiceId = svcDerma.ServiceId, OfficeId = office2.OfficeId, DatumVreme = nextMon.AddDays(1).AddHours(1), TrajanjeMinuta = 30, CreatorId = creatorId },
            new Appointment { PatientId = pat4.PatientId, DoctorId = drAmra.DoctorId, ServiceId = svcOrtop.ServiceId, OfficeId = office3.OfficeId, DatumVreme = nextMon.AddDays(2), TrajanjeMinuta = 30, CreatorId = creatorId },
            new Appointment { PatientId = pat5.PatientId, DoctorId = drAdnan.DoctorId, ServiceId = svcNeuro.ServiceId, OfficeId = office4.OfficeId, DatumVreme = nextMon.AddDays(3), TrajanjeMinuta = 45, CreatorId = creatorId }
        );

        // Past appointment (realized)
        db.Appointments.Add(new Appointment
        {
            PatientId = pat1.PatientId, DoctorId = drAmir.DoctorId, ServiceId = svcOpsti.ServiceId,
            OfficeId = office1.OfficeId, DatumVreme = now.AddDays(-7), TrajanjeMinuta = 30,
            Status = "realizovan", CreatorId = creatorId
        });
        await db.SaveChangesAsync();

        // --- Waiting List Items ---
        db.WaitingListItems.AddRange(
            new WaitingListItem { PatientId = pat2.PatientId, ServiceId = svcKardio.ServiceId, DoctorId = drLejla.DoctorId, Prioritet = 1, Napomena = "Hitno - bol u grudima" },
            new WaitingListItem { PatientId = pat4.PatientId, ServiceId = svcDermoskop.ServiceId, Prioritet = 2, Napomena = "Kontrolni pregled mladeža" },
            new WaitingListItem { PatientId = pat5.PatientId, ServiceId = svcOrtop.ServiceId, Prioritet = 3 }
        );
        await db.SaveChangesAsync();

        // --- Invoices with discounts ---
        var studentDiscount = await db.Discounts.FirstAsync(d => d.Tip == "student");
        var pensionerDiscount = await db.Discounts.FirstAsync(d => d.Tip == "penzioner");
        var paket2Discount = await db.Discounts.FirstAsync(d => d.Tip == "paket2");

        // Invoice 1: Student patient (Merima) – 2 items → student + paket2
        var inv1Total = svcDerma.Cena + svcDermoskop.Cena; // 4000 + 3500 = 7500
        var inv1DiscountPct = studentDiscount.Procenat + paket2Discount.Procenat; // 15 + 5 = 20%
        var inv1 = new Invoice
        {
            PatientId = pat4.PatientId, BrojRacuna = "RN-20260315-001",
            DatumIzdavanja = now.AddDays(-3), UkupanIznos = inv1Total,
            PopustProcenat = inv1DiscountPct, IznosZaNaplatu = inv1Total * (1 - inv1DiscountPct / 100),
            StatusNaplate = "neplaceno"
        };
        inv1.Items.Add(new InvoiceItem { ServiceId = svcDerma.ServiceId, JedinicnaCena = svcDerma.Cena, Kolicina = 1, Iznos = svcDerma.Cena });
        inv1.Items.Add(new InvoiceItem { ServiceId = svcDermoskop.ServiceId, JedinicnaCena = svcDermoskop.Cena, Kolicina = 1, Iznos = svcDermoskop.Cena });
        inv1.InvoiceDiscounts.Add(new InvoiceDiscount { DiscountId = studentDiscount.DiscountId, Procenat = studentDiscount.Procenat });
        inv1.InvoiceDiscounts.Add(new InvoiceDiscount { DiscountId = paket2Discount.DiscountId, Procenat = paket2Discount.Procenat });
        db.Invoices.Add(inv1);

        // Invoice 2: Pensioner patient (Senad) – 1 item → penzioner popust
        var inv2Total = svcOrtop.Cena; // 4500
        var inv2 = new Invoice
        {
            PatientId = pat3.PatientId, BrojRacuna = "RN-20260316-001",
            DatumIzdavanja = now.AddDays(-2), UkupanIznos = inv2Total,
            PopustProcenat = pensionerDiscount.Procenat, IznosZaNaplatu = inv2Total * (1 - pensionerDiscount.Procenat / 100),
            StatusNaplate = "placeno"
        };
        inv2.Items.Add(new InvoiceItem { ServiceId = svcOrtop.ServiceId, JedinicnaCena = svcOrtop.Cena, Kolicina = 1, Iznos = svcOrtop.Cena });
        inv2.InvoiceDiscounts.Add(new InvoiceDiscount { DiscountId = pensionerDiscount.DiscountId, Procenat = pensionerDiscount.Procenat });
        inv2.Payments.Add(new Payment { Iznos = inv2Total * (1 - pensionerDiscount.Procenat / 100), NacinPlacanja = "gotovina", DatumPlacanja = now.AddDays(-2) });
        db.Invoices.Add(inv2);

        // Invoice 3: Regular patient (Edin) – no discounts
        var inv3Total = svcOpsti.Cena; // 3000
        var inv3 = new Invoice
        {
            PatientId = pat1.PatientId, BrojRacuna = "RN-20260317-001",
            DatumIzdavanja = now.AddDays(-1), UkupanIznos = inv3Total,
            PopustProcenat = 0, IznosZaNaplatu = inv3Total,
            StatusNaplate = "neplaceno"
        };
        inv3.Items.Add(new InvoiceItem { ServiceId = svcOpsti.ServiceId, JedinicnaCena = svcOpsti.Cena, Kolicina = 1, Iznos = svcOpsti.Cena });
        db.Invoices.Add(inv3);

        await db.SaveChangesAsync();
    }
}
