using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApi.Domain.Entities;

namespace WebApi.Infrastructure.Persistence;

internal sealed class ExpenseEntityTypeConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("expenses");
        
        builder.HasKey(e => e.Id);
        
        // Contrainte sur la description (max 50 caractères)
        builder.Property(e => e.Description)
            .HasMaxLength(50)
            .IsRequired();
        
        // Relation avec User
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // Index sur UserId pour améliorer les performances
        builder.HasIndex(e => e.UserId);
        
        // Index sur Date pour les requêtes de tri
        builder.HasIndex(e => e.Date);
    }
}

