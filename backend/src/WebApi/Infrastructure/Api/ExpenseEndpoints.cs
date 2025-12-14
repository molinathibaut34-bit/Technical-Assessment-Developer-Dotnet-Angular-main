using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Domain.Entities;
using WebApi.Models;
using WebApi.Infrastructure.Persistence;

namespace WebApi.Infrastructure.Api;

internal static class ExpenseEndpoints
{

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

        group.MapGet("/user/{userId:guid}/report", GetExpenseReport)
            .WithName("GetExpenseReport")
            .WithSummary("Génère un rapport de dépenses mensuel pour un utilisateur")
            .Produces<ExpenseReport>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapDelete("/user/{userId:guid}/report", DeleteExpenseReport)
            .WithName("DeleteExpenseReport")
            .WithSummary("Supprime toutes les dépenses d'un utilisateur pour un mois donné")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPost("/", CreateExpense)
            .WithName("CreateExpense")
            .WithSummary("Crée une nouvelle dépense")
            .Produces<ExpenseInfo>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:guid}", DeleteExpense)
            .WithName("DeleteExpense")
            .WithSummary("Supprime une dépense par son ID")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static IResult GetExpenses(AppDbContext db)
    {
        var expenses = db.Set<Expense>()
            .Join(
                db.Set<User>(),
                expense => expense.UserId,
                user => user.Id,
                (expense, user) => new ExpenseInfo(
                    expense.Id,
                    expense.Description,
                    expense.Amount,
                    expense.Date,
                    expense.Category,
                    expense.UserId,
                    $"{user.FirstName} {user.LastName}",
                    expense.BillingCompany,
                    expense.BillingStreet,
                    expense.BillingPostalCode,
                    expense.BillingCity))
            .ToList();

        return Results.Ok(expenses);
    }

    private static IResult GetExpenseById(Guid id, AppDbContext db)
    {
        var expense = db.Set<Expense>()
            .Where(e => e.Id == id)
            .Join(
                db.Set<User>(),
                expense => expense.UserId,
                user => user.Id,
                (expense, user) => new ExpenseInfo(
                    expense.Id,
                    expense.Description,
                    expense.Amount,
                    expense.Date,
                    expense.Category,
                    expense.UserId,
                    $"{user.FirstName} {user.LastName}",
                    expense.BillingCompany,
                    expense.BillingStreet,
                    expense.BillingPostalCode,
                    expense.BillingCity))
            .FirstOrDefault();

        if (expense == null)
        {
            return Results.NotFound();
        }

        return Results.Ok(expense);
    }

    private static IResult GetExpensesByUserId(Guid userId, AppDbContext db)
    {
        var user = db.Set<User>().FirstOrDefault(u => u.Id == userId);
        var userName = user != null ? $"{user.FirstName} {user.LastName}" : "Utilisateur inconnu";
        
        var expenses = db.Set<Expense>()
            .Where(e => e.UserId == userId)
            .Select(e => new ExpenseInfo(
                e.Id,
                e.Description,
                e.Amount,
                e.Date,
                e.Category,
                e.UserId,
                userName,
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
        var user = await db.Set<User>().FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user == null)
        {
            return Results.NotFound("User not found");
        }

        // Vérifier que l'utilisateur est actif
        if (!user.IsActive)
        {
            return Results.BadRequest("Impossible d'ajouter une dépense à un utilisateur inactif");
        }

        // Vérifier la longueur de la description
        if (request.Description.Length > 50)
        {
            return Results.BadRequest("Description cannot exceed 50 characters");
        }

        // Vérifier le quota mensuel
        // Convertir la date en UTC si nécessaire
        var expenseDate = request.Date.Kind == DateTimeKind.Utc 
            ? request.Date.Date 
            : request.Date.ToUniversalTime().Date;
        var monthStart = new DateTime(expenseDate.Year, expenseDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = new DateTime(expenseDate.Year, expenseDate.Month, DateTime.DaysInMonth(expenseDate.Year, expenseDate.Month), 23, 59, 59, DateTimeKind.Utc);

        var monthlyTotal = await db.Set<Expense>()
            .Where(e => e.UserId == request.UserId && e.Date >= monthStart && e.Date <= monthEnd)
            .SumAsync(e => (decimal?)e.Amount) ?? 0;

        if (monthlyTotal + request.Amount > user.MonthlyExpenseQuota)
        {
            return Results.BadRequest($"Le quota mensuel de {user.MonthlyExpenseQuota:C} est dépassé. Montant actuel: {monthlyTotal:C}, tentative d'ajout: {request.Amount:C}");
        }

        // S'assurer que la date est en UTC avant de l'enregistrer
        var expenseDateUtc = request.Date.Kind == DateTimeKind.Utc 
            ? request.Date 
            : request.Date.ToUniversalTime();

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            Description = request.Description,
            Amount = request.Amount,
            Date = expenseDateUtc,
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
            $"{user.FirstName} {user.LastName}",
            expense.BillingCompany,
            expense.BillingStreet,
            expense.BillingPostalCode,
            expense.BillingCity);

        return Results.Created($"/expenses/{expense.Id}", expenseInfo);
    }

    private static async Task<IResult> GetExpenseReport(
        Guid userId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        AppDbContext db)
    {
        // Vérifier que l'utilisateur existe
        var user = await db.Set<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return Results.NotFound("User not found");
        }

        // Utiliser l'année et le mois actuels si non spécifiés
        var now = DateTime.Now;
        var reportYear = year ?? now.Year;
        var reportMonth = month ?? now.Month;

        // Valider les paramètres
        if (reportYear < 2000 || reportYear > 2100)
        {
            return Results.BadRequest("L'année doit être entre 2000 et 2100");
        }

        if (reportMonth < 1 || reportMonth > 12)
        {
            return Results.BadRequest("Le mois doit être entre 1 et 12");
        }

        // Calculer les dates de début et fin du mois en UTC
        // Le premier jour du mois à 00:00:00 UTC
        var periodStart = new DateTime(reportYear, reportMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        // Le premier jour du mois suivant à 00:00:00 UTC (exclusif)
        var periodEnd = periodStart.AddMonths(1);

        // Récupérer les dépenses du mois
        // Utiliser une comparaison >= start et < end (exclusif) pour être sûr de capturer toutes les dates
        var expenses = await db.Set<Expense>()
            .Where(e => e.UserId == userId && e.Date >= periodStart && e.Date < periodEnd)
            .OrderBy(e => e.Date)
            .Select(e => new ExpenseInfo(
                e.Id,
                e.Description,
                e.Amount,
                e.Date,
                e.Category,
                e.UserId,
                $"{user.FirstName} {user.LastName}",
                e.BillingCompany,
                e.BillingStreet,
                e.BillingPostalCode,
                e.BillingCity))
            .ToListAsync();

        var totalAmount = expenses.Sum(e => e.Amount);

        // Pour l'affichage, utiliser la date de fin réelle du mois
        var periodEndDisplay = new DateTime(reportYear, reportMonth, DateTime.DaysInMonth(reportYear, reportMonth), 23, 59, 59, DateTimeKind.Utc);

        var report = new ExpenseReport(
            userId,
            $"{user.FirstName} {user.LastName}",
            reportYear,
            reportMonth,
            periodStart,
            periodEndDisplay,
            totalAmount,
            expenses.Count,
            expenses);

        return Results.Ok(report);
    }

    private static async Task<IResult> DeleteExpenseReport(
        Guid userId,
        [FromQuery] int? year,
        [FromQuery] int? month,
        AppDbContext db)
    {
        // Vérifier que l'utilisateur existe
        var user = await db.Set<User>().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return Results.NotFound("User not found");
        }

        // Utiliser l'année et le mois actuels si non spécifiés
        var now = DateTime.Now;
        var reportYear = year ?? now.Year;
        var reportMonth = month ?? now.Month;

        // Valider les paramètres
        if (reportYear < 2000 || reportYear > 2100)
        {
            return Results.BadRequest("L'année doit être entre 2000 et 2100");
        }

        if (reportMonth < 1 || reportMonth > 12)
        {
            return Results.BadRequest("Le mois doit être entre 1 et 12");
        }

        // Calculer les dates de début et fin du mois en UTC
        // Le premier jour du mois à 00:00:00 UTC
        var periodStart = new DateTime(reportYear, reportMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        // Le premier jour du mois suivant à 00:00:00 UTC (exclusif)
        var periodEnd = periodStart.AddMonths(1);

        // Récupérer toutes les dépenses du mois
        // Utiliser une comparaison >= start et < end (exclusif) pour être sûr de capturer toutes les dates
        var expenses = await db.Set<Expense>()
            .Where(e => e.UserId == userId && e.Date >= periodStart && e.Date < periodEnd)
            .ToListAsync();

        if (expenses.Count == 0)
        {
            return Results.NotFound("Aucune dépense trouvée pour cette période");
        }

        // Supprimer toutes les dépenses
        db.Set<Expense>().RemoveRange(expenses);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static async Task<IResult> DeleteExpense(Guid id, AppDbContext db)
    {
        var expense = await db.Set<Expense>().FindAsync(id);

        if (expense == null)
        {
            return Results.NotFound();
        }

        db.Set<Expense>().Remove(expense);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}

