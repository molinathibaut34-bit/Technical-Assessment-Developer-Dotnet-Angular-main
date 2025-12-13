using Microsoft.EntityFrameworkCore;
using WebApi.Domain.Entities;

namespace WebApi.Infrastructure.Persistence;

internal sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfiguration(new UserEntityTypeConfiguration());
        modelBuilder.ApplyConfiguration(new ExpenseEntityTypeConfiguration());
    }

    internal static async Task SeedAsync(DbContext context, CancellationToken cancellationToken)
    {
        if (!context.Set<User>().Any())
        {
            var users = new[]
            {
                new User { FirstName = "Juste", LastName = "Leblanc", IsActive = true },
                new User { FirstName = "Marc", LastName = "Assin", IsActive = false },
                new User { FirstName = "Sophie", LastName = "Martin", IsActive = true },
                new User { FirstName = "Pierre", LastName = "Dubois", IsActive = true },
                new User { FirstName = "Marie", LastName = "Bernard", IsActive = false },
                new User { FirstName = "Jean", LastName = "Lefebvre", IsActive = true },
                new User { FirstName = "Claire", LastName = "Moreau", IsActive = true },
                new User { FirstName = "Thomas", LastName = "Laurent", IsActive = true },
                new User { FirstName = "Julie", LastName = "Simon", IsActive = false },
                new User { FirstName = "Antoine", LastName = "Michel", IsActive = true }
            };

            foreach (var user in users)
            {
                context.Set<User>().Add(user);
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        // Seed expenses si la table est vide
        if (!context.Set<Expense>().Any() && context.Set<User>().Any())
        {
            var users = context.Set<User>().ToList();

            var expenses = new[]
            {
                new Expense
                {
                    Description = "Repas d'affaires",
                    Amount = 45.50m,
                    Date = DateTime.UtcNow.AddDays(-10),
                    Category = "Restaurant",
                    UserId = users[0].Id,
                    BillingCompany = "Restaurant Le Gourmet",
                    BillingStreet = "15 Rue de la Paix",
                    BillingPostalCode = "75001",
                    BillingCity = "Paris"
                },
                new Expense
                {
                    Description = "Transport en taxi",
                    Amount = 28.00m,
                    Date = DateTime.UtcNow.AddDays(-8),
                    Category = "Transport",
                    UserId = users[0].Id,
                    BillingCompany = "Taxi Parisien",
                    BillingStreet = "10 Avenue des Champs",
                    BillingPostalCode = "75008",
                    BillingCity = "Paris"
                },
                new Expense
                {
                    Description = "Hôtel pour déplacement",
                    Amount = 120.00m,
                    Date = DateTime.UtcNow.AddDays(-5),
                    Category = "Hébergement",
                    UserId = users[2].Id,
                    BillingCompany = "Hôtel Central",
                    BillingStreet = "25 Boulevard Saint-Michel",
                    BillingPostalCode = "75005",
                    BillingCity = "Paris"
                },
                new Expense
                {
                    Description = "Fournitures de bureau",
                    Amount = 35.75m,
                    Date = DateTime.UtcNow.AddDays(-3),
                    Category = "Fournitures",
                    UserId = users[3].Id,
                    BillingCompany = "Papeterie Moderne",
                    BillingStreet = "8 Rue du Commerce",
                    BillingPostalCode = "69001",
                    BillingCity = "Lyon"
                },
                new Expense
                {
                    Description = "Carburant",
                    Amount = 65.20m,
                    Date = DateTime.UtcNow.AddDays(-1),
                    Category = "Transport",
                    UserId = users[4].Id,
                    BillingCompany = "Station Total",
                    BillingStreet = "42 Route Nationale",
                    BillingPostalCode = "13001",
                    BillingCity = "Marseille"
                }
            };

            foreach (var expense in expenses)
            {
                context.Set<Expense>().Add(expense);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}