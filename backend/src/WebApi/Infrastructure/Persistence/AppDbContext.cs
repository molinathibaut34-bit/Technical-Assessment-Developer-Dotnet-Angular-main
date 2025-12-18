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

        if (!context.Set<Expense>().Any() && context.Set<User>().Any())
        {
            var users = context.Set<User>().Where(u => u.IsActive).ToList();
            if (users.Count == 0)
            {
                return;
            }

            var now = DateTime.UtcNow;
            var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            var firstActiveUser = users[0];
            var expenses = new List<Expense>();

            var descriptions = new[]
            {
                "Repas d'affaires - Restaurant",
                "Transport en taxi",
                "Hôtel pour déplacement",
                "Fournitures de bureau",
                "Carburant",
                "Parking",
                "Déjeuner client",
                "Train Paris-Lyon",
                "Petit-déjeuner réunion",
                "Location de voiture",
                "Frais de péage",
                "Dîner d'affaires"
            };

            var categories = new[]
            {
                "Restaurant",
                "Transport",
                "Hébergement",
                "Fournitures",
                "Transport",
                "Transport",
                "Restaurant",
                "Transport",
                "Restaurant",
                "Transport",
                "Transport",
                "Restaurant"
            };

            var amounts = new[]
            {
                45.50m, 28.00m, 120.00m, 35.75m, 65.20m, 12.50m,
                55.00m, 89.90m, 18.30m, 95.00m, 8.50m, 72.00m
            };

            var billingCompanies = new[]
            {
                "Restaurant Le Gourmet",
                "Taxi Parisien",
                "Hôtel Central",
                "Papeterie Moderne",
                "Station Total",
                "Parking Central",
                "Brasserie du Centre",
                "SNCF",
                "Café des Arts",
                "Europcar",
                "Autoroutes de France",
                "Restaurant La Belle Époque"
            };

            for (int i = 0; i < 12; i++)
            {
                var dayInMonth = (i % 25) + 1;
                var expenseDate = new DateTime(now.Year, now.Month, dayInMonth, 10, 0, 0, DateTimeKind.Utc);
                
                expenses.Add(new Expense
                {
                    Id = Guid.NewGuid(),
                    Description = descriptions[i],
                    Amount = amounts[i],
                    Date = expenseDate,
                    Category = categories[i],
                    UserId = firstActiveUser.Id,
                    BillingCompany = billingCompanies[i],
                    BillingStreet = $"{10 + i} Rue de la Paix",
                    BillingPostalCode = "75001",
                    BillingCity = "Paris"
                });
            }

            var previousMonth1 = now.AddMonths(-1);
            var previousMonth1Start = new DateTime(previousMonth1.Year, previousMonth1.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            for (int i = 0; i < 8; i++)
            {
                var dayInMonth = (i % 20) + 1;
                var expenseDate = new DateTime(previousMonth1.Year, previousMonth1.Month, dayInMonth, 14, 0, 0, DateTimeKind.Utc);
                
                expenses.Add(new Expense
                {
                    Id = Guid.NewGuid(),
                    Description = descriptions[i % descriptions.Length],
                    Amount = amounts[i % amounts.Length],
                    Date = expenseDate,
                    Category = categories[i % categories.Length],
                    UserId = firstActiveUser.Id,
                    BillingCompany = billingCompanies[i % billingCompanies.Length],
                    BillingStreet = $"{20 + i} Avenue des Champs",
                    BillingPostalCode = "75008",
                    BillingCity = "Paris"
                });
            }

            var previousMonth2 = now.AddMonths(-2);
            var previousMonth2Start = new DateTime(previousMonth2.Year, previousMonth2.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            
            for (int i = 0; i < 6; i++)
            {
                var dayInMonth = (i % 18) + 1;
                var expenseDate = new DateTime(previousMonth2.Year, previousMonth2.Month, dayInMonth, 9, 0, 0, DateTimeKind.Utc);
                
                expenses.Add(new Expense
                {
                    Id = Guid.NewGuid(),
                    Description = descriptions[(i + 2) % descriptions.Length],
                    Amount = amounts[(i + 3) % amounts.Length],
                    Date = expenseDate,
                    Category = categories[(i + 1) % categories.Length],
                    UserId = firstActiveUser.Id,
                    BillingCompany = billingCompanies[(i + 2) % billingCompanies.Length],
                    BillingStreet = $"{30 + i} Boulevard Haussmann",
                    BillingPostalCode = "75009",
                    BillingCity = "Paris"
                });
            }

            if (users.Count > 1)
            {
                expenses.Add(new Expense
                {
                    Id = Guid.NewGuid(),
                    Description = "Repas d'affaires",
                    Amount = 45.50m,
                    Date = currentMonthStart.AddDays(5),
                    Category = "Restaurant",
                    UserId = users[1].Id,
                    BillingCompany = "Restaurant Le Gourmet",
                    BillingStreet = "15 Rue de la Paix",
                    BillingPostalCode = "75001",
                    BillingCity = "Paris"
                });

                expenses.Add(new Expense
                {
                    Id = Guid.NewGuid(),
                    Description = "Transport en taxi",
                    Amount = 28.00m,
                    Date = currentMonthStart.AddDays(8),
                    Category = "Transport",
                    UserId = users[1].Id,
                    BillingCompany = "Taxi Parisien",
                    BillingStreet = "10 Avenue des Champs",
                    BillingPostalCode = "75008",
                    BillingCity = "Paris"
                });

                for (int i = 0; i < 5; i++)
                {
                    var dayInMonth = (i % 15) + 1;
                    var expenseDate = new DateTime(previousMonth1.Year, previousMonth1.Month, dayInMonth, 12, 0, 0, DateTimeKind.Utc);
                    
                    expenses.Add(new Expense
                    {
                        Id = Guid.NewGuid(),
                        Description = descriptions[(i + 4) % descriptions.Length],
                        Amount = amounts[(i + 5) % amounts.Length],
                        Date = expenseDate,
                        Category = categories[(i + 2) % categories.Length],
                        UserId = users[1].Id,
                        BillingCompany = billingCompanies[(i + 3) % billingCompanies.Length],
                        BillingStreet = $"{40 + i} Rue de Rivoli",
                        BillingPostalCode = "75004",
                        BillingCity = "Paris"
                    });
                }
            }

            if (users.Count > 2)
            {
                expenses.Add(new Expense
                {
                    Id = Guid.NewGuid(),
                    Description = "Hôtel pour déplacement",
                    Amount = 120.00m,
                    Date = currentMonthStart.AddDays(12),
                    Category = "Hébergement",
                    UserId = users[2].Id,
                    BillingCompany = "Hôtel Central",
                    BillingStreet = "25 Boulevard Saint-Michel",
                    BillingPostalCode = "75005",
                    BillingCity = "Paris"
                });

                for (int i = 0; i < 4; i++)
                {
                    var dayInMonth = (i % 12) + 1;
                    var expenseDate = new DateTime(previousMonth1.Year, previousMonth1.Month, dayInMonth, 16, 0, 0, DateTimeKind.Utc);
                    
                    expenses.Add(new Expense
                    {
                        Id = Guid.NewGuid(),
                        Description = descriptions[(i + 6) % descriptions.Length],
                        Amount = amounts[(i + 7) % amounts.Length],
                        Date = expenseDate,
                        Category = categories[(i + 3) % categories.Length],
                        UserId = users[2].Id,
                        BillingCompany = billingCompanies[(i + 4) % billingCompanies.Length],
                        BillingStreet = $"{50 + i} Rue de la République",
                        BillingPostalCode = "69002",
                        BillingCity = "Lyon"
                    });
                }
            }

            for (int userIndex = 3; userIndex < users.Count; userIndex++)
            {
                var user = users[userIndex];
                var monthOffset = userIndex % 3;
                var targetMonth = now.AddMonths(-monthOffset);
                
                for (int i = 0; i < 6; i++)
                {
                    var dayInMonth = (i % 20) + 1;
                    var expenseDate = new DateTime(targetMonth.Year, targetMonth.Month, dayInMonth, 10 + (i % 8), 0, 0, DateTimeKind.Utc);
                    
                    expenses.Add(new Expense
                    {
                        Id = Guid.NewGuid(),
                        Description = descriptions[i % descriptions.Length],
                        Amount = amounts[i % amounts.Length],
                        Date = expenseDate,
                        Category = categories[i % categories.Length],
                        UserId = user.Id,
                        BillingCompany = billingCompanies[i % billingCompanies.Length],
                        BillingStreet = $"{100 + userIndex * 10 + i} Rue de la Paix",
                        BillingPostalCode = "75001",
                        BillingCity = "Paris"
                    });
                }
            }

            foreach (var expense in expenses)
            {
                context.Set<Expense>().Add(expense);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}