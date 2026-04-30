import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="logo">▶</span>
          <span class="name">IPTV</span>
        </div>

        <nav>
          <a routerLink="/live" routerLinkActive="active">
            <span class="icon">📺</span>
            <span>Live TV</span>
          </a>
          <a routerLink="/movies" routerLinkActive="active">
            <span class="icon">🎬</span>
            <span>Movies</span>
          </a>
          <a routerLink="/series" routerLinkActive="active">
            <span class="icon">📚</span>
            <span>Series</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active">
            <span class="icon">⚙</span>
            <span>Settings</span>
          </a>
        </nav>

        <div class="account">
          @if (auth.accountInfo(); as info) {
            <div class="user">{{ info.user_info.username }}</div>
            @if (auth.getExpiryDate(); as exp) {
              <div class="expiry">Expires: {{ exp | date: 'mediumDate' }}</div>
            }
          }
          <button (click)="logout()">Logout</button>
        </div>
      </aside>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
      }
      .shell {
        display: grid;
        grid-template-columns: 220px 1fr;
        height: 100%;
        background: #050d11;
        color: #e6f1f4;
      }
      .sidebar {
        display: flex;
        flex-direction: column;
        background: #08161c;
        border-right: 1px solid #112830;
        padding: 1.5rem 1rem;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 2rem;
        padding: 0 0.5rem;
      }
      .logo {
        font-size: 1.4rem;
        color: #4dd0c8;
      }
      .name {
        font-weight: 700;
        letter-spacing: 0.05em;
        color: #4dd0c8;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        flex: 1;
      }
      nav a {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.7rem 0.8rem;
        border-radius: 8px;
        text-decoration: none;
        color: #8aa6b0;
        font-size: 0.9rem;
        transition: all 0.15s;
      }
      nav a:hover {
        background: #0e2028;
        color: #e6f1f4;
      }
      nav a.active {
        background: #11303a;
        color: #4dd0c8;
      }
      .icon {
        width: 1.2rem;
        text-align: center;
      }
      .account {
        padding-top: 1rem;
        border-top: 1px solid #112830;
        font-size: 0.8rem;
      }
      .user {
        font-weight: 600;
        color: #e6f1f4;
      }
      .expiry {
        color: #5c7780;
        margin: 0.2rem 0 0.7rem;
        font-size: 0.75rem;
      }
      .account button {
        width: 100%;
        padding: 0.5rem;
        background: transparent;
        border: 1px solid #1d3a44;
        border-radius: 6px;
        color: #a8c0c8;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.15s;
      }
      .account button:hover {
        border-color: #4dd0c8;
        color: #4dd0c8;
      }
      main {
        overflow: auto;
        background: #050d11;
      }
    `,
  ],
})
export class ShellComponent {
  auth = inject(AuthService);

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
