namespace WebApi.Models;

public sealed record UserInfo(Guid Id, string Name, bool IsActive);

public sealed record UserDetailInfo(
    Guid Id,
    string FirstName,
    string LastName,
    string Name,
    bool IsActive,
    decimal MonthlyExpenseQuota);

public sealed record CreateUserRequest(
    string FirstName,
    string LastName,
    bool IsActive,
    decimal MonthlyExpenseQuota);

public sealed record UpdateUserRequest(
    string FirstName,
    string LastName,
    bool IsActive,
    decimal MonthlyExpenseQuota);

