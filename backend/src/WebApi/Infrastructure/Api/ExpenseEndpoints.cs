using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Domain.Entities;
using WebApi.Infrastructure.Persistence;

namespace WebApi.Infrastructure.Api;

internal static class ExpenseEndpoints
{
    public sealed record ExpenseInfo(
        Guid Id,
        string Description,
        decimal Amount,
        DateTime Date,
        string? Category,
        Guid UserId,
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

    public static IEndpointRouteBuilder MapExpenseEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/expenses")
            .WithTags("Expenses")
            .WithOpenApi();

        group.MapGet("/", GetExpenses)
            .WithName("GetExpenses")
            .WithSummary("Récupère la liste de toutes les dépenses")
            .Produces<IEnumerable<ExpenseInfo>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", GetExpenseById)
            .WithName("GetExpenseById")
            .WithSummary("Récupère une dépense par son ID")
            .Produces<ExpenseInfo>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapGet("/user/{userId:guid}", GetExpensesByUserId)
            .WithName("GetExpensesByUserId")
            .WithSummary("Récupère les dépenses d'un utilisateur")
            .Produces<IEnumerable<ExpenseInfo>>(StatusCodes.Status200OK);

        group.MapPost("/", CreateExpense)
            .WithName("CreateExpense")
            .WithSummary("Crée une nouvelle dépense")
            .Produces<ExpenseInfo>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static IResult GetExpenses(AppDbContext db)
    {
        var expenses = db.Set<Expense>()
            .Select(e => new ExpenseInfo(
                e.Id,
                e.Description,
                e.Amount,
                e.Date,
                e.Category,
                e.UserId,
                e.BillingCompany,
                e.BillingStreet,
                e.BillingPostalCode,
                e.BillingCity))
            .ToList();

        return Results.Ok(expenses);
    }

    private static IResult GetExpenseById(Guid id, AppDbContext db)
    {
        var expense = db.Set<Expense>()
            .Where(e => e.Id == id)
            .Select(e => new ExpenseInfo(
                e.Id,
                e.Description,
                e.Amount,
                e.Date,
                e.Category,
                e.UserId,
                e.BillingCompany,
                e.BillingStreet,
                e.BillingPostalCode,
                e.BillingCity))
            .FirstOrDefault();

        if (expense == null)
        {
            return Results.NotFound();
        }

        return Results.Ok(expense);
    }

    private static IResult GetExpensesByUserId(Guid userId, AppDbContext db)
    {
        var expenses = db.Set<Expense>()
            .Where(e => e.UserId == userId)
            .Select(e => new ExpenseInfo(
                e.Id,
                e.Description,
                e.Amount,
                e.Date,
                e.Category,
                e.UserId,
                e.BillingCompany,
                e.BillingStreet,
                e.BillingPostalCode,
                e.BillingCity))
            .ToList();

        return Results.Ok(expenses);
    }

    private static async Task<IResult> CreateExpense(CreateExpenseRequest request, AppDbContext db)
    {
        // Vérifier que l'utilisateur existe
        var userExists = await db.Set<User>().AnyAsync(u => u.Id == request.UserId);
        if (!userExists)
        {
            return Results.NotFound("User not found");
        }

        // Vérifier la longueur de la description
        if (request.Description.Length > 50)
        {
            return Results.BadRequest("Description cannot exceed 50 characters");
        }

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            Description = request.Description,
            Amount = request.Amount,
            Date = request.Date,
            Category = request.Category,
            UserId = request.UserId,
            BillingCompany = request.BillingCompany,
            BillingStreet = request.BillingStreet,
            BillingPostalCode = request.BillingPostalCode,
            BillingCity = request.BillingCity
        };

        db.Set<Expense>().Add(expense);
        await db.SaveChangesAsync();

        var expenseInfo = new ExpenseInfo(
            expense.Id,
            expense.Description,
            expense.Amount,
            expense.Date,
            expense.Category,
            expense.UserId,
            expense.BillingCompany,
            expense.BillingStreet,
            expense.BillingPostalCode,
            expense.BillingCity);

        return Results.Created($"/expenses/{expense.Id}", expenseInfo);
    }
}

