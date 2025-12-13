using Microsoft.EntityFrameworkCore;
using System.Diagnostics.CodeAnalysis;
using WebApi.Infrastructure.Api;
using WebApi.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.AddRedisClient(connectionName: "cache");
builder.AddNpgsqlDbContext<AppDbContext>(connectionName: "database",
    configureDbContextOptions: options =>
        options.UseAsyncSeeding(async (context, _, cancellationToken) =>
            await AppDbContext.SeedAsync(context, cancellationToken)));
builder.Services
    .AddOpenApi()
    .AddPersistence();
builder.Services.AddHealthChecks();

var app = builder.Build();

// Apply database migrations
try
{
    using var sp = app.Services.CreateScope();
    var dbContext = sp.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = sp.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    logger.LogInformation("Applying database migrations...");
    await dbContext.Database.MigrateAsync();
    logger.LogInformation("Database migrations applied successfully.");
}
catch (Exception e)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(e, "An error occurred while migrating the database.");
    logger.LogError("Error details: {Message}", e.Message);
    if (e.InnerException != null)
    {
        logger.LogError("Inner exception: {InnerMessage}", e.InnerException.Message);
    }
    // Continue execution instead of returning to allow manual SQL fix
    logger.LogWarning("Application will continue, but database may be in an inconsistent state.");
    logger.LogWarning("Please ensure the database exists and migrations are applied manually if needed.");
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapUserEndpoints();
app.MapExpenseEndpoints();
app.MapHealthChecks("/health");

app.Run();

[SuppressMessage("ReSharper", "ClassNeverInstantiated.Global")]
public partial class Program;