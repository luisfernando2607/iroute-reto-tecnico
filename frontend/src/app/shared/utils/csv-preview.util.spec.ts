import { detectDelimiter, missingColumns, parseCsvPreview, splitLine } from './csv-preview.util';

describe('csv-preview.util', () => {
  const header = 'pc_codcom;pc_nomcomred;pc_tipodoc;pc_numdoc;pc_direccion;pc_telefono;pc_email;pc_processdate';

  it('detects semicolon and comma delimiters', () => {
    expect(detectDelimiter('a;b;c')).toBe(';');
    expect(detectDelimiter('a,b,c')).toBe(',');
  });

  it('splits quoted fields keeping the delimiter inside quotes', () => {
    expect(splitLine('1;"Av. A; B";x', ';')).toEqual(['1', 'Av. A; B', 'x']);
  });

  it('parses header, rows and total count', () => {
    const p = parseCsvPreview(`${header}\nC1;BODEGA;RUC;123;Av;9;a@b;16/10/2026\nC2;;RUC;;Av;9;a@b;16/10/2026\n`);
    expect(p.headers.length).toBe(8);
    expect(p.totalRows).toBe(2);
    expect(p.rows[1][1]).toBe('');
  });

  it('limits preview rows but reports the real total', () => {
    const lines = Array.from({ length: 5 }, (_, i) => `C${i};N;RUC;1;A;9;e;16/10/2026`);
    const p = parseCsvPreview([header, ...lines].join('\n'), 2);
    expect(p.rows.length).toBe(2);
    expect(p.totalRows).toBe(5);
  });

  it('reports missing required columns', () => {
    expect(missingColumns(['pc_codcom'])).toContain('pc_numdoc');
    expect(missingColumns(header.split(';'))).toEqual([]);
  });
});
