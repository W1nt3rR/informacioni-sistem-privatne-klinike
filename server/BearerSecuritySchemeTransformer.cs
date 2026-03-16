using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace PrivateClinic.API;

internal sealed class BearerSecuritySchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider)
    : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        var authSchemes = await authenticationSchemeProvider.GetAllSchemesAsync();
        if (!authSchemes.Any(s => s.Name == "Bearer"))
            return;

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
        {
            ["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                In = ParameterLocation.Header,
                BearerFormat = "JWT"
            }
        };

        var securityRequirement = new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer")] = new List<string>()
        };

        foreach (var operation in document.Paths.Values.SelectMany(path => path.Operations))
        {
            operation.Value.Security.Add(securityRequirement);
        }
    }
}
