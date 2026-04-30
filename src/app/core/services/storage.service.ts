import { Injectable } from '@angular/core';
import { XtreamCredentials } from '../models/xtream.models';

interface ElectronAPI {
  store: {
    get: <T = unknown>(key: string) => Promise<T | undefined>;
    set: (key: string, value: unknown) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private get api(): ElectronAPI | null {
    return window.electron ?? null;
  }

  // ----- Credentials -----
  async getCredentials(): Promise<XtreamCredentials | null> {
    const creds = await this.api?.store.get<XtreamCredentials>('credentials');
    return creds ?? null;
  }

  async setCredentials(creds: XtreamCredentials): Promise<void> {
    await this.api?.store.set('credentials', creds);
  }

  async clearCredentials(): Promise<void> {
    await this.api?.store.delete('credentials');
  }

  // ----- Favorites -----
  async getFavorites(): Promise<number[]> {
    return (await this.api?.store.get<number[]>('favorites')) ?? [];
  }

  async toggleFavorite(streamId: number): Promise<number[]> {
    const current = await this.getFavorites();
    const updated = current.includes(streamId)
      ? current.filter((id) => id !== streamId)
      : [...current, streamId];
    await this.api?.store.set('favorites', updated);
    return updated;
  }

  // ----- Watch History (VOD continue-watching) -----
  async getWatchHistory(): Promise<Record<number, number>> {
    return (await this.api?.store.get<Record<number, number>>('watchHistory')) ?? {};
  }

  async saveWatchPosition(streamId: number, positionSecs: number): Promise<void> {
    const history = await this.getWatchHistory();
    history[streamId] = positionSecs;
    await this.api?.store.set('watchHistory', history);
  }
}
