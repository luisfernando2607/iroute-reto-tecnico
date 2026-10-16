/** Parseo ligero de CSV en el navegador para previsualizar antes de enviar al API. */

export interface CsvPreview {
  delimiter: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export const REQUIRED_COLUMNS = [
  'pc_codcom',
  'pc_nomcomred',
  'pc_tipodoc',
  'pc_numdoc',
  'pc_direccion',
  'pc_telefono',
  'pc_email',
  'pc_processdate',
] as const;

/** Patrón del nombre de archivo exigido por el reto. */
export const FILE_NAME_PATTERN = /^commerce_\d{8}\.csv$/i;

export function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi >= comma ? ';' : ',';
}

/** Divide una línea respetando comillas dobles. */
export function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

export function parseCsvPreview(text: string, maxRows = 200): CsvPreview {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { delimiter: ';', headers: [], rows: [], totalRows: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map((h) => h.toLowerCase());
  const rows = lines.slice(1, 1 + maxRows).map((l) => splitLine(l, delimiter));

  return { delimiter, headers, rows, totalRows: lines.length - 1 };
}

export function missingColumns(headers: string[]): string[] {
  const set = new Set(headers);
  return REQUIRED_COLUMNS.filter((c) => !set.has(c));
}

/**
 * Replica en el cliente las reglas de `sp_process_commerce` para anticipar al usuario
 * qué filas terminarán en cuarentena. La validación definitiva la hace la base de datos.
 */
export function rowIssues(row: string[], headers: string[]): string[] {
  const get = (col: string) => row[headers.indexOf(col)] ?? '';
  const issues: string[] = [];
  const nom = get('pc_nomcomred');
  const doc = get('pc_numdoc');

  if (!nom) issues.push('nomcomred vacío');
  if (!doc) issues.push('numdoc vacío');
  else {
    if (/[a-z]/i.test(doc)) issues.push('numdoc con letras');
    if (/[^0-9a-z]/i.test(doc)) issues.push('numdoc con caracteres especiales');
  }
  return issues;
}
