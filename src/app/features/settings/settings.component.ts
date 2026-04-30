import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="settings">
      <h2>Settings</h2>

      @if (auth.accountInfo(); as info) {
        <section class="card">
          <h3>Account</h3>
          <dl>
            <dt>Username</dt><dd>{{ info.user_info.username }}</dd>
            <dt>Status</dt><dd>{{ info.user_info.status }}</dd>
            <dt>Expires</dt>
            <dd>
              @if (auth.getExpiryDate(); as exp) {
                {{ exp | date: 'medium' }}
              } @else {
                —
              }
            </dd>
            <dt>Max Connections</dt><dd>{{ info.user_info.max_connections }}</dd>
            <dt>Active Connections</dt><dd>{{ info.user_info.active_cons }}</dd>
          </dl>
        </section>

        <section class="card">
          <h3>Server</h3>
          <dl>
            <dt>URL</dt><dd>{{ info.server_info.url }}:{{ info.server_info.port }}</dd>
            <dt>Protocol</dt><dd>{{ info.server_info.server_protocol }}</dd>
            <dt>Timezone</dt><dd>{{ info.server_info.timezone }}</dd>
          </dl>
        </section>
      }

      <section class="card">
        <h3>Actions</h3>
        <button (click)="logout()">Sign out</button>
      </section>
    </div>
  `,
  styles: [
    `
      :host { display: block; padding: 2rem; max-width: 800px; }
      h2 { color: #e6f1f4; margin: 0 0 1.5rem; }
      .card {
        background: #08161c;
        border: 1px solid #112830;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
      }
      h3 {
        margin: 0 0 1rem;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #4dd0c8;
      }
      dl {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 0.6rem 1rem;
        margin: 0;
      }
      dt { color: #5c7780; font-size: 0.85rem; }
      dd { color: #e6f1f4; margin: 0; font-size: 0.9rem; }
      button {
        padding: 0.6rem 1.2rem;
        background: transparent;
        border: 1px solid #6b2730;
        border-radius: 6px;
        color: #f4a3ad;
        cursor: pointer;
      }
      button:hover { background: #3a1418; }
    `,
  ],
})
export class SettingsComponent {
  auth = inject(AuthService);
  storage = inject(StorageService);

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
