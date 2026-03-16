using Microsoft.AspNetCore.Identity;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        string[] roles = ["admin", "recepcija", "lekar", "menadzer", "pacijent"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        const string adminUserName = "admin";
        if (await userManager.FindByNameAsync(adminUserName) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminUserName,
                Email = "admin@clinic.local",
                Ime = "Admin",
                Prezime = "System",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin123");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "admin");
        }
    }
}
