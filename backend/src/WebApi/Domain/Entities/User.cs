namespace WebApi.Domain.Entities;

internal sealed class User
{
    public Guid Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal MonthlyExpenseQuota { get; set; } = 1000.00m; // Quota mensuel par défaut
}