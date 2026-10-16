/** Contratos compartidos con el API (.NET). Las fechas viajan como ISO `yyyy-MM-dd`. */

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  username: string;
}

export interface CsvRowError {
  line: number;
  message: string;
}

export interface UploadResult {
  fileName: string;
  totalRows: number;
  insertedRows: number;
  processDates: string[];
  errors: CsvRowError[];
}

export interface ProcessResult {
  processDate: string;
  quarantinedCount: number;
}

export interface ProcessDateSummary {
  processDate: string;
  pendingCount: number;
  quarantinedCount: number;
}

export interface QuarantinedCommerce {
  id: number;
  commerceId: number;
  codCom: string | null;
  nomComRed: string | null;
  tipoDoc: string | null;
  numDoc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  processDate: string;
  motivo: string;
  quarantinedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Cuerpo de error RFC 7807 que devuelve el API. */
export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
}
