namespace WebApi.Models;

public sealed record ExpenseInfo(
    Guid Id,
    string Description,
    decimal Amount,
    DateTime Date,
    string? Category,
    Guid UserId,
    string UserName,
    string? BillingCompany,
    string? BillingStreet,
    string? BillingPostalCode,
    string? BillingCity);

public sealed record CreateExpenseRequest(
    string Description,
    decimal Amount,
    DateTime Date,
    string? Category,
    Guid UserId,
    string? BillingCompany,
    string? BillingStreet,
    string? BillingPostalCode,
    string? BillingCity);

public sealed record ExpenseReport(
    Guid UserId,
    string UserName,
    int Year,
    int Month,
    DateTime PeriodStart,
    DateTime PeriodEnd,
    decimal TotalAmount,
    int ExpenseCount,
    IEnumerable<ExpenseInfo> Expenses);

