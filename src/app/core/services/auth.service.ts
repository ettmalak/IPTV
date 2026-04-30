import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { XtreamCredentials, XtreamLoginResponse } from '../models/xtream.models';
import { StorageService } from './storage.service';
import { XtreamService } from './xtream.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private xtream = inject(XtreamService);
  private storage = inject(StorageService);
  private router = inject(Router);

  private _accountInfo = signal<XtreamLoginResponse | null>(null);
  accountInfo = this._accountInfo.asReadonly();

  isAuthenticated = signal(false);

  async login(creds: XtreamCredentials, remember = true): Promise<void> {
    const response = await this.xtream.login(creds);
    this._accountInfo.set(response);
    this.isAuthenticated.set(true);
    if (remember) {
      await this.storage.setCredentials(creds);
    }
  }

  /** Try silent login from stored credentials. Returns true on success. */
  async tryAutoLogin(): Promise<boolean> {
    const stored = await this.storage.getCredentials();
    if (!stored) return false;
    try {
      await this.login(stored, false);
      return true;
    } catch {
      await this.storage.clearCredentials();
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.storage.clearCredentials();
    this.xtream.setCredentials(null);
    this._accountInfo.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  /** Convert exp_date unix timestamp to readable date. */
  getExpiryDate(): Date | null {
    const exp = this._accountInfo()?.user_info.exp_date;
    if (!exp) return null;
    return new Date(parseInt(exp, 10) * 1000);
  }
}
