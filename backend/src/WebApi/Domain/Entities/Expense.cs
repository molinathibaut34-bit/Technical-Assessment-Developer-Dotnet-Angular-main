namespace WebApi.Domain.Entities;

internal sealed class Expense
{
    public Guid Id { get; set; }
    public required string Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? Category { get; set; }
    
    // Relation avec User
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    // Adresse de facturation
    public string? BillingCompany { get; set; }
    public string? BillingStreet { get; set; }
    public string? BillingPostalCode { get; set; }
    public string? BillingCity { get; set; }
}

