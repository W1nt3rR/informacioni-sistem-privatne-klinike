namespace PrivateClinic.API.Models;

public class Specialization
{
    public int SpecializationId { get; set; }
    public string Naziv { get; set; } = string.Empty;
    public string? Opis { get; set; }

    // Navigation
    public ICollection<Doctor> Doctors { get; set; } = [];
    public ICollection<Service> Services { get; set; } = [];
}
