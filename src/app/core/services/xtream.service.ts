import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, of, shareReplay, tap } from 'rxjs';
import {
  XtreamCategory,
  XtreamCredentials,
  XtreamEpgEntry,
  XtreamLiveStream,
  XtreamLoginResponse,
  XtreamSeries,
  XtreamSeriesInfo,
  XtreamVodInfo,
  XtreamVodStream,
} from '../models/xtream.models';

@Injectable({ providedIn: 'root' })
export class XtreamService {
  private http = inject(HttpClient);

  private _credentials = signal<XtreamCredentials | null>(null);
  credentials = this._credentials.asReadonly();

  // simple memory caches keyed by URL - clears on logout
  private cache = new Map<string, Observable<unknown>>();

  setCredentials(creds: XtreamCredentials | null): void {
    if (creds) {
      creds = { ...creds, serverUrl: creds.serverUrl.replace(/\/$/, '') };
    }
    this._credentials.set(creds);
    this.cache.clear();
  }

  private requireCreds(): XtreamCredentials {
    const c = this._credentials();
    if (!c) throw new Error('Not authenticated');
    return c;
  }

  private apiUrl(action?: string, extraParams: Record<string, string | number> = {}): string {
    const c = this.requireCreds();
    const params = new URLSearchParams({
      username: c.username,
      password: c.password,
    });
    if (action) params.set('action', action);
    for (const [k, v] of Object.entries(extraParams)) {
      params.set(k, String(v));
    }
    return `${c.serverUrl}/player_api.php?${params.toString()}`;
  }

  /** Cached GET - second call to same URL hits memory, not network */
  private cached<T>(url: string): Observable<T> {
    const hit = this.cache.get(url) as Observable<T> | undefined;
    if (hit) return hit;
    const stream = this.http.get<T>(url).pipe(shareReplay(1));
    this.cache.set(url, stream as Observable<unknown>);
    return stream;
  }

  // ----- Auth -----
  async login(creds: XtreamCredentials): Promise<XtreamLoginResponse> {
    const normalized = { ...creds, serverUrl: creds.serverUrl.replace(/\/$/, '') };
    const url = `${normalized.serverUrl}/player_api.php?username=${encodeURIComponent(
      normalized.username,
    )}&password=${encodeURIComponent(normalized.password)}`;

    const response = await firstValueFrom(this.http.get<XtreamLoginResponse>(url));

    if (!response?.user_info || response.user_info.auth !== 1) {
      throw new Error('Invalid credentials or account inactive');
    }
    if (response.user_info.status !== 'Active') {
      throw new Error(`Account status: ${response.user_info.status}`);
    }

    this.setCredentials(normalized);
    return response;
  }

  // ----- Categories (cached) -----
  getLiveCategories(): Observable<XtreamCategory[]> {
    return this.cached<XtreamCategory[]>(this.apiUrl('get_live_categories'));
  }
  getVodCategories(): Observable<XtreamCategory[]> {
    return this.cached<XtreamCategory[]>(this.apiUrl('get_vod_categories'));
  }
  getSeriesCategories(): Observable<XtreamCategory[]> {
    return this.cached<XtreamCategory[]>(this.apiUrl('get_series_categories'));
  }

  // ----- Streams (cached per URL = per category) -----
  getLiveStreams(categoryId?: string): Observable<XtreamLiveStream[]> {
    const url = categoryId
      ? this.apiUrl('get_live_streams', { category_id: categoryId })
      : this.apiUrl('get_live_streams');
    return this.cached<XtreamLiveStream[]>(url);
  }
  getVodStreams(categoryId?: string): Observable<XtreamVodStream[]> {
    const url = categoryId
      ? this.apiUrl('get_vod_streams', { category_id: categoryId })
      : this.apiUrl('get_vod_streams');
    return this.cached<XtreamVodStream[]>(url);
  }
  getSeries(categoryId?: string): Observable<XtreamSeries[]> {
    const url = categoryId
      ? this.apiUrl('get_series', { category_id: categoryId })
      : this.apiUrl('get_series');
    return this.cached<XtreamSeries[]>(url);
  }

  // ----- Detail (cached per id) -----
  getVodInfo(vodId: number): Observable<XtreamVodInfo> {
    return this.cached<XtreamVodInfo>(this.apiUrl('get_vod_info', { vod_id: vodId }));
  }
  getSeriesInfo(seriesId: number): Observable<XtreamSeriesInfo> {
    return this.cached<XtreamSeriesInfo>(
      this.apiUrl('get_series_info', { series_id: seriesId }),
    );
  }

  // ----- EPG (NOT cached - changes over time) -----
  getShortEpg(streamId: number, limit = 5): Observable<{ epg_listings: XtreamEpgEntry[] }> {
    return this.http.get<{ epg_listings: XtreamEpgEntry[] }>(
      this.apiUrl('get_short_epg', { stream_id: streamId, limit }),
    );
  }

  // ----- Stream URLs -----
  getLiveStreamUrl(streamId: number, format: 'm3u8' | 'ts' = 'm3u8'): string {
    const c = this.requireCreds();
    return `${c.serverUrl}/live/${c.username}/${c.password}/${streamId}.${format}`;
  }
  getVodStreamUrl(streamId: number, extension: string): string {
    const c = this.requireCreds();
    return `${c.serverUrl}/movie/${c.username}/${c.password}/${streamId}.${extension}`;
  }
  getSeriesEpisodeUrl(episodeId: string, extension: string): string {
    const c = this.requireCreds();
    return `${c.serverUrl}/series/${c.username}/${c.password}/${episodeId}.${extension}`;
  }

  static decodeEpgText(b64: string): string {
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch {
      return b64;
    }
  }
}
