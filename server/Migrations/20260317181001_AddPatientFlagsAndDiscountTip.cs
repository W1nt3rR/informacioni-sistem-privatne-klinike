using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrivateClinic.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientFlagsAndDiscountTip : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "JePenzioner",
                table: "Patients",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "JeStudent",
                table: "Patients",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Tip",
                table: "Discounts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JePenzioner",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "JeStudent",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "Tip",
                table: "Discounts");
        }
    }
}
