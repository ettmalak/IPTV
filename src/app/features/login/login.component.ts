import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-shell">
      <div class="login-card">
        <header>
          <h1>IPTV Player</h1>
          <p class="subtitle">Sign in with your Xtream Codes account</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            <span>Server URL</span>
            <input
              type="url"
              formControlName="serverUrl"
              placeholder="http://example.com:8080"
              autocomplete="off"
              spellcheck="false"
            />
          </label>

          <label>
            <span>Username</span>
            <input type="text" formControlName="username" autocomplete="username" />
          </label>

          <label>
            <span>Password</span>
            <input type="password" formControlName="password" autocomplete="current-password" />
          </label>

          <label class="checkbox">
            <input type="checkbox" formControlName="remember" />
            <span>Remember me</span>
          </label>

          @if (error()) {
            <div class="error">{{ error() }}</div>
          }

          <button type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <footer>
          <small>Your credentials are stored encrypted on this device only.</small>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .login-shell {
        display: grid;
        place-items: center;
        height: 100vh;
        padding: 2rem;
        background: radial-gradient(ellipse at top, #0e1f26 0%, #06101580%, #030708 100%);
      }
      .login-card {
        width: 100%;
        max-width: 420px;
        padding: 2.5rem;
        background: #0d1c22;
        border: 1px solid #173039;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      header {
        text-align: center;
        margin-bottom: 2rem;
      }
      h1 {
        margin: 0 0 0.25rem;
        font-size: 1.75rem;
        color: #4dd0c8;
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 0;
        color: #7a9aa3;
        font-size: 0.9rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: #a8c0c8;
      }
      label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      input[type='url'],
      input[type='text'],
      input[type='password'] {
        padding: 0.7rem 0.9rem;
        background: #061318;
        border: 1px solid #1d3a44;
        border-radius: 8px;
        color: #e6f1f4;
        font-size: 0.95rem;
        transition: border-color 0.15s;
      }
      input:focus {
        outline: none;
        border-color: #4dd0c8;
      }
      button[type='submit'] {
        margin-top: 0.5rem;
        padding: 0.85rem;
        background: #4dd0c8;
        color: #06101a;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: background 0.15s;
      }
      button[type='submit']:hover:not(:disabled) {
        background: #6ee0d8;
      }
      button[type='submit']:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .error {
        padding: 0.7rem;
        background: #3a1418;
        border: 1px solid #6b2730;
        border-radius: 6px;
        color: #f4a3ad;
        font-size: 0.85rem;
      }
      footer {
        margin-top: 1.5rem;
        text-align: center;
      }
      footer small {
        color: #5c7780;
        font-size: 0.75rem;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    serverUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [true],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { serverUrl, username, password, remember } = this.form.getRawValue();
      await this.auth.login({ serverUrl, username, password }, remember);
      this.router.navigate(['/live']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }
}
