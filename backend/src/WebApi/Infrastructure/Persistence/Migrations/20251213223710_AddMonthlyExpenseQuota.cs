using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebApi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyExpenseQuota : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyExpenseQuota",
                table: "users",
                type: "numeric",
                nullable: false,
                defaultValue: 1000.00m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MonthlyExpenseQuota",
                table: "users");
        }
    }
}
