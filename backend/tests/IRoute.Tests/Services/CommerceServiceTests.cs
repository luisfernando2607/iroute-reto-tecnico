using IRoute.Application.Abstractions;
using IRoute.Application.Dtos;
using IRoute.Application.Exceptions;
using IRoute.Application.Services;
using IRoute.Domain.Entities;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace IRoute.Tests.Services;

public class CommerceServiceTests
{
    private readonly ICommerceRepository _repo = Substitute.For<ICommerceRepository>();
    private readonly ICommerceCsvParser _parser = Substitute.For<ICommerceCsvParser>();
    private readonly CommerceService _sut;

    public CommerceServiceTests()
        => _sut = new CommerceService(_repo, _parser, NullLogger<CommerceService>.Instance);

    private static CommerceRecord Record(DateOnly date)
        => new("C1", "NOMBRE", "RUC", "123", null, null, null, date);

    [Fact]
    public async Task Upload_with_zero_length_throws_empty_file()
    {
        await Assert.ThrowsAsync<EmptyFileException>(
            () => _sut.UploadAsync(Stream.Null, "commerce_16102026.csv", 0));

        await _repo.DidNotReceiveWithAnyArgs().CreateAsync(default!);
    }

    [Theory]
    [InlineData("datos.csv")]
    [InlineData("commerce_16102026.txt")]
    public async Task Upload_with_wrong_file_name_throws_bad_request(string name)
    {
        await Assert.ThrowsAsync<BadRequestException>(
            () => _sut.UploadAsync(Stream.Null, name, 10));
    }

    [Fact]
    public async Task Upload_inserts_parsed_rows_and_returns_distinct_dates()
    {
        var d1 = new DateOnly(2026, 10, 16);
        var d2 = new DateOnly(2026, 10, 15);
        _parser.ParseAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns(new CsvParseResult([Record(d1), Record(d1), Record(d2)], [new CsvRowError(5, "fecha")]));
        _repo.CreateAsync(Arg.Any<IReadOnlyCollection<CommerceRecord>>(), Arg.Any<CancellationToken>()).Returns(3);

        var result = await _sut.UploadAsync(Stream.Null, "commerce_16102026.csv", 100);

        Assert.Equal(4, result.TotalRows);
        Assert.Equal(3, result.InsertedRows);
        Assert.Equal([d1, d2], result.ProcessDates);
        Assert.Single(result.Errors);
    }

    [Fact]
    public async Task Upload_with_only_invalid_rows_throws_bad_request()
    {
        _parser.ParseAsync(Arg.Any<Stream>(), Arg.Any<CancellationToken>())
            .Returns(new CsvParseResult([], [new CsvRowError(2, "fecha inválida")]));

        var ex = await Assert.ThrowsAsync<BadRequestException>(
            () => _sut.UploadAsync(Stream.Null, "commerce_16102026.csv", 100));

        Assert.Contains("línea 2", ex.Message);
    }

    [Fact]
    public async Task Process_returns_quarantined_count()
    {
        var date = new DateOnly(2026, 10, 16);
        _repo.ProcessAsync(date, Arg.Any<CancellationToken>()).Returns(4);

        var result = await _sut.ProcessAsync(date);

        Assert.Equal(date, result.ProcessDate);
        Assert.Equal(4, result.QuarantinedCount);
    }

    [Fact]
    public async Task GetQuarantine_clamps_paging_arguments()
    {
        _repo.GetQuarantineAsync(null, 1, 500, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<QuarantinedCommerce>([], 0, 1, 500));

        await _sut.GetQuarantineAsync(null, page: -3, pageSize: 9999);

        await _repo.Received(1).GetQuarantineAsync(null, 1, 500, Arg.Any<CancellationToken>());
    }
}
