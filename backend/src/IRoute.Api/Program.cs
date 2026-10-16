using System.Text;
using IRoute.Api.Auth;
using IRoute.Api.Middleware;
using IRoute.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------------------------------------------------------
// Servicios
// ----------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();

builder.Services.AddIRouteServices(builder.Configuration);

// Límite de tamaño para el archivo CSV (configurable)
var maxUploadMb = builder.Configuration.GetValue("Upload:MaxFileSizeMb", 20);
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = maxUploadMb * 1024L * 1024L);

// Autenticación JWT (pantalla de login opcional del reto)
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
          ?? throw new InvalidOperationException("Falta la sección Jwt en la configuración.");
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<ITokenService, JwtTokenService>();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

// CORS para el front Angular
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:4200"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "i-Route Commerce API",
        Version = "v1",
        Description = "Carga, procesamiento y cuarentena de comercios (archivo commerce_DDMMYYYY.csv)."
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese el token obtenido en POST /api/auth/login"
    });
    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", doc)] = []
    });
    var xml = Path.Combine(AppContext.BaseDirectory, "IRoute.Api.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

// ----------------------------------------------------------------------------
// Pipeline
// ----------------------------------------------------------------------------
var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "i-Route API v1"));
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

/// <summary>Punto de entrada expuesto para pruebas de integración.</summary>
public partial class Program;
