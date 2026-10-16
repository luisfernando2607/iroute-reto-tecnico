using System.Text;
using IRoute.Application.Exceptions;
using IRoute.Infrastructure.Csv;

namespace IRoute.Tests.Csv;

public class CommerceCsvParserTests
{
    private readonly CommerceCsvParser _sut = new();

    private const string Header = "pc_codcom;pc_nomcomred;pc_tipodoc;pc_numdoc;pc_direccion;pc_telefono;pc_email;pc_processdate";

    private static MemoryStream Stream(string content) => new(Encoding.UTF8.GetBytes(content));

    [Fact]
    public async Task Parses_valid_rows_with_semicolon_delimiter()
    {
        var csv = $"{Header}\nC1;BODEGA;RUC;20123456789;Av 1;999;a@b.com;16/10/2026\n";

        var result = await _sut.ParseAsync(Stream(csv));

        Assert.Single(result.Records);
        Assert.Empty(result.Errors);
        var r = result.Records[0];
        Assert.Equal("BODEGA", r.NomComRed);
        Assert.Equal("20123456789", r.NumDoc);
        Assert.Equal(new DateOnly(2026, 10, 16), r.ProcessDate);
    }

    [Fact]
    public async Task Parses_comma_delimited_files()
    {
        var csv = Header.Replace(';', ',') + "\nC1,BODEGA,RUC,20123456789,Av 1,999,a@b.com,2026-10-16\n";

        var result = await _sut.ParseAsync(Stream(csv));

        Assert.Single(result.Records);
        Assert.Equal(new DateOnly(2026, 10, 16), result.Records[0].ProcessDate);
    }

    [Fact]
    public async Task Empty_values_become_null()
    {
        var csv = $"{Header}\nC1;;RUC;;Av 1;999;a@b.com;16/10/2026\n";

        var result = await _sut.ParseAsync(Stream(csv));

        Assert.Null(result.Records[0].NomComRed);
        Assert.Null(result.Records[0].NumDoc);
    }

    [Fact]
    public async Task Invalid_date_is_reported_as_row_error_without_aborting()
    {
        var csv = $"{Header}\nC1;A;RUC;1;x;1;a@b.com;31/02/2026\nC2;B;RUC;2;x;1;a@b.com;16/10/2026\n";

        var result = await _sut.ParseAsync(Stream(csv));

        Assert.Single(result.Records);
        Assert.Single(result.Errors);
        Assert.Equal(2, result.Errors[0].Line);
    }

    [Fact]
    public async Task Missing_required_column_throws_bad_request()
    {
        var csv = "pc_codcom;pc_nomcomred\nC1;A\n";

        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _sut.ParseAsync(Stream(csv)));

        Assert.Contains("pc_numdoc", ex.Message);
    }

    [Fact]
    public async Task Empty_content_throws_empty_file()
    {
        await Assert.ThrowsAsync<EmptyFileException>(() => _sut.ParseAsync(Stream("")));
    }
}
