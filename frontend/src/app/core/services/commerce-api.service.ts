import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PagedResult,
  ProcessDateSummary,
  ProcessResult,
  QuarantinedCommerce,
  UploadResult,
} from '../models/commerce.models';

/** Cliente HTTP del controlador `api/commerce`. */
@Injectable({ providedIn: 'root' })
export class CommerceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/commerce`;

  /** POST /upload — envía el CSV como multipart/form-data. */
  upload(file: File): Observable<UploadResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<UploadResult>(`${this.baseUrl}/upload`, form);
  }

  /** POST /process — valida los registros de una fecha (yyyy-MM-dd). */
  process(processDate: string): Observable<ProcessResult> {
    return this.http.post<ProcessResult>(`${this.baseUrl}/process`, { processDate });
  }

  /** GET /quarantine — listado paginado con filtro opcional por fecha. */
  getQuarantine(processDate: string | null, page: number, pageSize: number): Observable<PagedResult<QuarantinedCommerce>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (processDate) params = params.set('processDate', processDate);
    return this.http.get<PagedResult<QuarantinedCommerce>>(`${this.baseUrl}/quarantine`, { params });
  }

  /** GET /summary — pendientes y en cuarentena por fecha de proceso. */
  getSummary(): Observable<ProcessDateSummary[]> {
    return this.http.get<ProcessDateSummary[]>(`${this.baseUrl}/summary`);
  }
}
