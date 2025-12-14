using Microsoft.AspNetCore.Mvc;
using WebApi.Domain.Entities;
using WebApi.Models;
using WebApi.Infrastructure.Persistence;

namespace WebApi.Infrastructure.Api;

internal static class UserEndpoints
{

    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/users")
            .WithTags("Users")
            .WithOpenApi();

        group.MapGet("/", GetUsers)
            .WithName("GetUsers")
            .WithSummary("Récupère la liste de tous les utilisateurs")
            .Produces<IEnumerable<UserInfo>>(StatusCodes.Status200OK);

        group.MapGet("/{id:guid}", GetUserById)
            .WithName("GetUserById")
            .WithSummary("Récupère un utilisateur par son ID")
            .Produces<UserDetailInfo>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateUser)
            .WithName("CreateUser")
            .WithSummary("Crée un nouvel utilisateur")
            .Produces<UserDetailInfo>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapPut("/{id:guid}", UpdateUser)
            .WithName("UpdateUser")
            .WithSummary("Met à jour un utilisateur")
            .Produces<UserDetailInfo>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status400BadRequest);

        group.MapDelete("/{id:guid}", DeleteUser)
            .WithName("DeleteUser")
            .WithSummary("Supprime un utilisateur")
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound);

        return endpoints;
    }

    private static IResult GetUsers(AppDbContext db)
    {
        var users = db.Set<User>()
            .Select(u => new UserInfo(u.Id, $"{u.FirstName} {u.LastName}", u.IsActive))
            .ToList();
        
        return Results.Ok(users);
    }

    private static IResult GetUserById(Guid id, AppDbContext db)
    {
        var user = db.Set<User>()
            .Where(u => u.Id == id)
            .Select(u => new UserDetailInfo(u.Id, u.FirstName, u.LastName, $"{u.FirstName} {u.LastName}", u.IsActive, u.MonthlyExpenseQuota))
            .FirstOrDefault();

        if (user == null)
        {
            return Results.NotFound();
        }

        return Results.Ok(user);
    }

    private static IResult CreateUser(CreateUserRequest request, AppDbContext db)
    {
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsActive = request.IsActive,
            MonthlyExpenseQuota = request.MonthlyExpenseQuota
        };

        db.Set<User>().Add(user);
        db.SaveChanges();

        var userDetail = new UserDetailInfo(
            user.Id,
            user.FirstName,
            user.LastName,
            $"{user.FirstName} {user.LastName}",
            user.IsActive,
            user.MonthlyExpenseQuota);

        return Results.Created($"/users/{user.Id}", userDetail);
    }

    private static IResult UpdateUser(Guid id, UpdateUserRequest request, AppDbContext db)
    {
        var user = db.Set<User>().FirstOrDefault(u => u.Id == id);

        if (user == null)
        {
            return Results.NotFound();
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.IsActive = request.IsActive;
        user.MonthlyExpenseQuota = request.MonthlyExpenseQuota;

        db.SaveChanges();

        var userDetail = new UserDetailInfo(
            user.Id,
            user.FirstName,
            user.LastName,
            $"{user.FirstName} {user.LastName}",
            user.IsActive,
            user.MonthlyExpenseQuota);

        return Results.Ok(userDetail);
    }

    private static IResult DeleteUser(Guid id, AppDbContext db)
    {
        var user = db.Set<User>().FirstOrDefault(u => u.Id == id);
        var expensesExist = db.Set<Expense>().Any(e => e.UserId == id);

        if (user == null)
        {
            return Results.NotFound();
        }
        if(expensesExist)
        {
            return Results.BadRequest("Cannot delete user with associated expenses.");
        }

        db.Set<User>().Remove(user);
        db.SaveChanges();

        return Results.NoContent();
    }
}