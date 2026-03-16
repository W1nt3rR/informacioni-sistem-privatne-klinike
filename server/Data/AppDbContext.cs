using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<Specialization> Specializations => Set<Specialization>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<DoctorService> DoctorServices => Set<DoctorService>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Allergy> Allergies => Set<Allergy>();
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<WorkingHours> WorkingHours => Set<WorkingHours>();
    public DbSet<NonWorkingDay> NonWorkingDays => Set<NonWorkingDay>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<WaitingListItem> WaitingListItems => Set<WaitingListItem>();
    public DbSet<Diagnosis> Diagnoses => Set<Diagnosis>();
    public DbSet<Examination> Examinations => Set<Examination>();
    public DbSet<Therapy> Therapies => Set<Therapy>();
    public DbSet<Referral> Referrals => Set<Referral>();
    public DbSet<MedicalReport> MedicalReports => Set<MedicalReport>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Discount> Discounts => Set<Discount>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ConfigureApplicationUser(builder);
        ConfigureDoctor(builder);
        ConfigureSpecialization(builder);
        ConfigureService(builder);
        ConfigureDoctorService(builder);
        ConfigurePatient(builder);
        ConfigureAllergy(builder);
        ConfigureOffice(builder);
        ConfigureWorkingHours(builder);
        ConfigureNonWorkingDay(builder);
        ConfigureAppointment(builder);
        ConfigureWaitingListItem(builder);
        ConfigureDiagnosis(builder);
        ConfigureExamination(builder);
        ConfigureTherapy(builder);
        ConfigureReferral(builder);
        ConfigureMedicalReport(builder);
        ConfigureInvoice(builder);
        ConfigureInvoiceItem(builder);
        ConfigurePayment(builder);
        ConfigureDiscount(builder);
        ConfigureNotification(builder);
        ConfigureActivityLog(builder);
        ConfigureMessage(builder);
    }

    private static void ConfigureApplicationUser(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.Ime).HasMaxLength(50).IsRequired();
            e.Property(u => u.Prezime).HasMaxLength(50).IsRequired();
            e.Property(u => u.Aktivan).HasDefaultValue(true);
            e.Property(u => u.DatumKreiranja).HasDefaultValueSql("GETUTCDATE()");
        });
    }

    private static void ConfigureDoctor(ModelBuilder builder)
    {
        builder.Entity<Doctor>(e =>
        {
            e.HasKey(d => d.DoctorId);
            e.HasOne(d => d.User)
                .WithOne(u => u.Doctor)
                .HasForeignKey<Doctor>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(d => d.UserId).IsUnique();
            e.HasOne(d => d.Specialization)
                .WithMany(s => s.Doctors)
                .HasForeignKey(d => d.SpecializationId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(d => d.Titula).HasMaxLength(20);
            e.Property(d => d.LicencaBroj).HasMaxLength(30).IsRequired();
            e.HasIndex(d => d.LicencaBroj).IsUnique();
            e.Property(d => d.Aktivan).HasDefaultValue(true);
        });
    }

    private static void ConfigureSpecialization(ModelBuilder builder)
    {
        builder.Entity<Specialization>(e =>
        {
            e.HasKey(s => s.SpecializationId);
            e.Property(s => s.Naziv).HasMaxLength(100).IsRequired();
            e.HasIndex(s => s.Naziv).IsUnique();
            e.Property(s => s.Opis).HasMaxLength(500);
        });
    }

    private static void ConfigureService(ModelBuilder builder)
    {
        builder.Entity<Service>(e =>
        {
            e.HasKey(s => s.ServiceId);
            e.Property(s => s.Naziv).HasMaxLength(100).IsRequired();
            e.Property(s => s.Opis).HasMaxLength(500);
            e.Property(s => s.Cena).HasColumnType("decimal(10,2)");
            e.HasOne(s => s.Specialization)
                .WithMany(sp => sp.Services)
                .HasForeignKey(s => s.SpecializationId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(s => s.Aktivan).HasDefaultValue(true);
        });
    }

    private static void ConfigureDoctorService(ModelBuilder builder)
    {
        builder.Entity<DoctorService>(e =>
        {
            e.HasKey(ds => new { ds.DoctorId, ds.ServiceId });
            e.HasOne(ds => ds.Doctor)
                .WithMany(d => d.DoctorServices)
                .HasForeignKey(ds => ds.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ds => ds.Service)
                .WithMany(s => s.DoctorServices)
                .HasForeignKey(ds => ds.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigurePatient(ModelBuilder builder)
    {
        builder.Entity<Patient>(e =>
        {
            e.HasKey(p => p.PatientId);
            e.Property(p => p.Ime).HasMaxLength(50).IsRequired();
            e.Property(p => p.Prezime).HasMaxLength(50).IsRequired();
            e.Property(p => p.JMBG).HasMaxLength(13).IsFixedLength().IsRequired();
            e.HasIndex(p => p.JMBG).IsUnique();
            e.Property(p => p.Pol).HasMaxLength(1).IsFixedLength().IsRequired();
            e.Property(p => p.Adresa).HasMaxLength(200);
            e.Property(p => p.Telefon).HasMaxLength(20).IsRequired();
            e.Property(p => p.Email).HasMaxLength(100);
            e.Property(p => p.BrojOsiguranja).HasMaxLength(50);
            e.Property(p => p.Napomene).HasMaxLength(500);
            e.Property(p => p.DatumRegistracije).HasDefaultValueSql("GETUTCDATE()");
            e.Property(p => p.Aktivan).HasDefaultValue(true);

            e.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Search indexes
            e.HasIndex(p => new { p.Ime, p.Prezime });
            e.HasIndex(p => p.Telefon);
            e.HasIndex(p => p.Email);
        });
    }

    private static void ConfigureAllergy(ModelBuilder builder)
    {
        builder.Entity<Allergy>(e =>
        {
            e.HasKey(a => a.AllergyId);
            e.Property(a => a.NazivAlergena).HasMaxLength(100).IsRequired();
            e.Property(a => a.Opis).HasMaxLength(500);
            e.Property(a => a.Ozbiljnost).HasMaxLength(20).IsRequired();
            e.HasOne(a => a.Patient)
                .WithMany(p => p.Allergies)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureOffice(ModelBuilder builder)
    {
        builder.Entity<Office>(e =>
        {
            e.HasKey(o => o.OfficeId);
            e.Property(o => o.Naziv).HasMaxLength(100).IsRequired();
            e.Property(o => o.Lokacija).HasMaxLength(200);
            e.Property(o => o.Oprema).HasMaxLength(500);
            e.Property(o => o.Dostupna).HasDefaultValue(true);
        });
    }

    private static void ConfigureWorkingHours(ModelBuilder builder)
    {
        builder.Entity<WorkingHours>(e =>
        {
            e.HasKey(w => w.WorkingHoursId);
            e.HasOne(w => w.Doctor)
                .WithMany(d => d.WorkingHours)
                .HasForeignKey(w => w.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureNonWorkingDay(ModelBuilder builder)
    {
        builder.Entity<NonWorkingDay>(e =>
        {
            e.HasKey(n => n.NonWorkingDayId);
            e.HasIndex(n => n.Datum).IsUnique();
            e.Property(n => n.Naziv).HasMaxLength(100).IsRequired();
            e.Property(n => n.Opis).HasMaxLength(500);
        });
    }

    private static void ConfigureAppointment(ModelBuilder builder)
    {
        builder.Entity<Appointment>(e =>
        {
            e.HasKey(a => a.AppointmentId);
            e.HasOne(a => a.Patient)
                .WithMany(p => p.Appointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Doctor)
                .WithMany(d => d.Appointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Service)
                .WithMany(s => s.Appointments)
                .HasForeignKey(a => a.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Office)
                .WithMany(o => o.Appointments)
                .HasForeignKey(a => a.OfficeId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Creator)
                .WithMany(u => u.CreatedAppointments)
                .HasForeignKey(a => a.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(a => a.Status).HasMaxLength(30).HasDefaultValue("zakazan");
            e.Property(a => a.RazlogPromene).HasMaxLength(500);
            e.Property(a => a.RazlogOtkazivanja).HasMaxLength(500);
            e.Property(a => a.DatumKreiranja).HasDefaultValueSql("GETUTCDATE()");

            // Indexes for calendar and conflict checking
            e.HasIndex(a => a.DatumVreme);
            e.HasIndex(a => new { a.DoctorId, a.DatumVreme });
            e.HasIndex(a => new { a.OfficeId, a.DatumVreme });
            e.HasIndex(a => a.Status);
        });
    }

    private static void ConfigureWaitingListItem(ModelBuilder builder)
    {
        builder.Entity<WaitingListItem>(e =>
        {
            e.HasKey(w => w.WaitingListItemId);
            e.HasOne(w => w.Patient)
                .WithMany(p => p.WaitingListItems)
                .HasForeignKey(w => w.PatientId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(w => w.Service)
                .WithMany(s => s.WaitingListItems)
                .HasForeignKey(w => w.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(w => w.Doctor)
                .WithMany()
                .HasForeignKey(w => w.DoctorId)
                .OnDelete(DeleteBehavior.SetNull);
            e.Property(w => w.Status).HasMaxLength(20).HasDefaultValue("aktivan");
            e.Property(w => w.Napomena).HasMaxLength(500);
            e.Property(w => w.DatumUpisa).HasDefaultValueSql("GETUTCDATE()");
            e.Property(w => w.Prioritet).HasDefaultValue(2);
        });
    }

    private static void ConfigureDiagnosis(ModelBuilder builder)
    {
        builder.Entity<Diagnosis>(e =>
        {
            e.HasKey(d => d.DiagnosisId);
            e.Property(d => d.Sifra).HasMaxLength(20).IsRequired();
            e.HasIndex(d => d.Sifra).IsUnique();
            e.Property(d => d.Naziv).HasMaxLength(200).IsRequired();
            e.Property(d => d.Opis).HasMaxLength(500);
        });
    }

    private static void ConfigureExamination(ModelBuilder builder)
    {
        builder.Entity<Examination>(e =>
        {
            e.HasKey(x => x.ExaminationId);
            e.HasOne(x => x.Appointment)
                .WithOne(a => a.Examination)
                .HasForeignKey<Examination>(x => x.AppointmentId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.AppointmentId).IsUnique();
            e.HasOne(x => x.Doctor)
                .WithMany(d => d.Examinations)
                .HasForeignKey(x => x.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Patient)
                .WithMany(p => p.Examinations)
                .HasForeignKey(x => x.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Diagnosis)
                .WithMany(d => d.Examinations)
                .HasForeignKey(x => x.DiagnosisId)
                .OnDelete(DeleteBehavior.SetNull);
            e.Property(x => x.Status).HasMaxLength(20).HasDefaultValue("u_toku");

            e.HasIndex(x => x.DatumPregleda);
        });
    }

    private static void ConfigureTherapy(ModelBuilder builder)
    {
        builder.Entity<Therapy>(e =>
        {
            e.HasKey(t => t.TherapyId);
            e.HasOne(t => t.Examination)
                .WithMany(x => x.Therapies)
                .HasForeignKey(t => t.ExaminationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(t => t.NazivLeka).HasMaxLength(100).IsRequired();
            e.Property(t => t.Doza).HasMaxLength(50).IsRequired();
            e.Property(t => t.Ucestalost).HasMaxLength(50).IsRequired();
            e.Property(t => t.Trajanje).HasMaxLength(50).IsRequired();
            e.Property(t => t.Napomena).HasMaxLength(500);
        });
    }

    private static void ConfigureReferral(ModelBuilder builder)
    {
        builder.Entity<Referral>(e =>
        {
            e.HasKey(r => r.ReferralId);
            e.HasOne(r => r.Examination)
                .WithMany(x => x.Referrals)
                .HasForeignKey(r => r.ExaminationId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(r => r.Tip).HasMaxLength(30).IsRequired();
            e.Property(r => r.Opis).IsRequired();
            e.Property(r => r.Status).HasMaxLength(20).HasDefaultValue("izdato");
        });
    }

    private static void ConfigureMedicalReport(ModelBuilder builder)
    {
        builder.Entity<MedicalReport>(e =>
        {
            e.HasKey(m => m.MedicalReportId);
            e.HasOne(m => m.Examination)
                .WithOne(x => x.MedicalReport)
                .HasForeignKey<MedicalReport>(m => m.ExaminationId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Patient)
                .WithMany(p => p.MedicalReports)
                .HasForeignKey(m => m.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Doctor)
                .WithMany(d => d.MedicalReports)
                .HasForeignKey(m => m.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(m => m.Sadrzaj).IsRequired();
            e.Property(m => m.DatumKreiranja).HasDefaultValueSql("GETUTCDATE()");
            e.Property(m => m.Status).HasMaxLength(20).HasDefaultValue("kreiran");
        });
    }

    private static void ConfigureInvoice(ModelBuilder builder)
    {
        builder.Entity<Invoice>(e =>
        {
            e.HasKey(i => i.InvoiceId);
            e.HasOne(i => i.Patient)
                .WithMany(p => p.Invoices)
                .HasForeignKey(i => i.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(i => i.BrojRacuna).HasMaxLength(30).IsRequired();
            e.HasIndex(i => i.BrojRacuna).IsUnique();
            e.Property(i => i.DatumIzdavanja).HasDefaultValueSql("GETUTCDATE()");
            e.Property(i => i.UkupanIznos).HasColumnType("decimal(12,2)");
            e.Property(i => i.PopustProcenat).HasColumnType("decimal(5,2)").HasDefaultValue(0m);
            e.Property(i => i.IznosZaNaplatu).HasColumnType("decimal(12,2)");
            e.Property(i => i.StatusNaplate).HasMaxLength(20).HasDefaultValue("neplaceno");
            e.Property(i => i.Napomena).HasMaxLength(500);

            e.HasIndex(i => i.DatumIzdavanja);
            e.HasIndex(i => i.StatusNaplate);
        });
    }

    private static void ConfigureInvoiceItem(ModelBuilder builder)
    {
        builder.Entity<InvoiceItem>(e =>
        {
            e.HasKey(ii => ii.InvoiceItemId);
            e.HasOne(ii => ii.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ii => ii.Service)
                .WithMany(s => s.InvoiceItems)
                .HasForeignKey(ii => ii.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(ii => ii.Examination)
                .WithMany(x => x.InvoiceItems)
                .HasForeignKey(ii => ii.ExaminationId)
                .OnDelete(DeleteBehavior.SetNull);
            e.Property(ii => ii.JedinicnaCena).HasColumnType("decimal(10,2)");
            e.Property(ii => ii.PopustProcenat).HasColumnType("decimal(5,2)").HasDefaultValue(0m);
            e.Property(ii => ii.Iznos).HasColumnType("decimal(10,2)");
            e.Property(ii => ii.Kolicina).HasDefaultValue(1);
        });
    }

    private static void ConfigurePayment(ModelBuilder builder)
    {
        builder.Entity<Payment>(e =>
        {
            e.HasKey(p => p.PaymentId);
            e.HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(p => p.Iznos).HasColumnType("decimal(12,2)");
            e.Property(p => p.NacinPlacanja).HasMaxLength(20).IsRequired();
            e.Property(p => p.DatumPlacanja).HasDefaultValueSql("GETUTCDATE()");
            e.Property(p => p.Napomena).HasMaxLength(500);
        });
    }

    private static void ConfigureDiscount(ModelBuilder builder)
    {
        builder.Entity<Discount>(e =>
        {
            e.HasKey(d => d.DiscountId);
            e.Property(d => d.Naziv).HasMaxLength(100).IsRequired();
            e.Property(d => d.Procenat).HasColumnType("decimal(5,2)");
            e.Property(d => d.Aktivan).HasDefaultValue(true);
        });
    }

    private static void ConfigureNotification(ModelBuilder builder)
    {
        builder.Entity<Notification>(e =>
        {
            e.HasKey(n => n.NotificationId);
            e.Property(n => n.Tip).HasMaxLength(30).IsRequired();
            e.Property(n => n.PrimalacTip).HasMaxLength(20).IsRequired();
            e.Property(n => n.Sadrzaj).IsRequired();
            e.Property(n => n.Status).HasMaxLength(20).HasDefaultValue("ceka");
            e.HasOne(n => n.Appointment)
                .WithMany(a => a.Notifications)
                .HasForeignKey(n => n.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasIndex(n => new { n.Status, n.DatumSlanja });
        });
    }

    private static void ConfigureActivityLog(ModelBuilder builder)
    {
        builder.Entity<ActivityLog>(e =>
        {
            e.HasKey(l => l.ActivityLogId);
            e.HasOne(l => l.User)
                .WithMany(u => u.ActivityLogs)
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(l => l.Akcija).HasMaxLength(30).IsRequired();
            e.Property(l => l.Tabela).HasMaxLength(100).IsRequired();
            e.Property(l => l.IpAdresa).HasMaxLength(45);
            e.Property(l => l.DatumVreme).HasDefaultValueSql("GETUTCDATE()");

            e.HasIndex(l => l.DatumVreme);
            e.HasIndex(l => new { l.UserId, l.DatumVreme });
        });
    }

    private static void ConfigureMessage(ModelBuilder builder)
    {
        builder.Entity<Message>(e =>
        {
            e.HasKey(m => m.MessageId);
            e.Property(m => m.PosiljalacTip).HasMaxLength(20).IsRequired();
            e.Property(m => m.PrimalacTip).HasMaxLength(20).IsRequired();
            e.Property(m => m.Sadrzaj).IsRequired();
            e.Property(m => m.DatumSlanja).HasDefaultValueSql("GETUTCDATE()");
            e.Property(m => m.Procitana).HasDefaultValue(false);
        });
    }
}
