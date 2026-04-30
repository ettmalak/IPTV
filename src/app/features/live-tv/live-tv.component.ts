import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  XtreamCategory,
  XtreamEpgEntry,
  XtreamLiveStream,
} from '../../core/models/xtream.models';
import { XtreamService } from '../../core/services/xtream.service';
import { PlayerComponent } from '../player/player.component';

@Component({
  selector: 'app-live-tv',
  standalone: true,
  imports: [PlayerComponent, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="live-grid">
      <!-- CATEGORIES -->
      <section class="col categories">
        <header>
          Categories
          <input
            class="search"
            type="search"
            placeholder="Filter…"
            (input)="catSearch.set($any($event.target).value)"
          />
        </header>
        <cdk-virtual-scroll-viewport itemSize="40" class="vlist">
          <div
            *cdkVirtualFor="let cat of filteredCategories(); trackBy: trackCat"
            class="row"
            [class.active]="cat.category_id === selectedCategoryId()"
            (click)="selectCategory(cat.category_id)"
          >
            {{ cat.category_name }}
          </div>
        </cdk-virtual-scroll-viewport>
      </section>

      <!-- CHANNELS -->
      <section class="col channels">
        <header>
          Channels
          <input
            class="search"
            type="search"
            placeholder="Search…"
            (input)="chSearch.set($any($event.target).value)"
          />
        </header>
        @if (loadingChannels()) {
          <div class="empty">Loading…</div>
        } @else {
          <cdk-virtual-scroll-viewport itemSize="48" class="vlist">
            <div
              *cdkVirtualFor="let ch of filteredChannels(); trackBy: trackCh"
              class="row channel-row"
              [class.active]="ch.stream_id === selectedChannel()?.stream_id"
              (click)="selectChannel(ch)"
            >
              @if (ch.stream_icon) {
                <img
                  [src]="ch.stream_icon"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  (error)="$any($event.target).style.display='none'"
                />
              }
              <span class="num">{{ ch.num }}</span>
              <span class="name">{{ ch.name }}</span>
            </div>
          </cdk-virtual-scroll-viewport>
        }
      </section>

      <!-- PLAYER + EPG -->
      <section class="col player-pane">
        @if (selectedChannel(); as ch) {
          <app-player [src]="streamUrl()" [type]="'live'" [title]="ch.name" />
          <div class="epg">
            <header>Now & Next</header>
            @if (epg().length) {
              <ul>
                @for (entry of epg(); track entry.id) {
                  <li [class.now]="entry.now_playing === 1">
                    <div class="time">
                      {{ formatTime(entry.start_timestamp) }} – {{ formatTime(entry.stop_timestamp) }}
                    </div>
                    <div class="title">{{ decode(entry.title) }}</div>
                  </li>
                }
              </ul>
            } @else {
              <p class="empty">No EPG data available.</p>
            }
          </div>
        } @else {
          <div class="placeholder">Select a channel to start watching</div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .live-grid {
        display: grid;
        grid-template-columns: 240px 320px 1fr;
        height: 100%;
      }
      .col {
        display: flex;
        flex-direction: column;
        border-right: 1px solid #112830;
        overflow: hidden;
      }
      .col:last-child { border-right: none; }
      header {
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #5c7780;
        border-bottom: 1px solid #112830;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .search {
        padding: 0.4rem 0.6rem;
        background: #061318;
        border: 1px solid #1d3a44;
        border-radius: 6px;
        color: #e6f1f4;
        font-size: 0.8rem;
        text-transform: none;
        letter-spacing: 0;
      }
      .search:focus { outline: none; border-color: #4dd0c8; }

      .vlist {
        flex: 1;
        height: 100%;
        contain: strict;
      }
      .row {
        height: 40px;
        padding: 0 1rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 0.85rem;
        color: #a8c0c8;
      }
      .row:hover { background: #0e2028; }
      .row.active {
        background: #11303a;
        color: #4dd0c8;
        border-left: 3px solid #4dd0c8;
        padding-left: calc(1rem - 3px);
      }
      .channel-row {
        height: 48px;
        gap: 0.6rem;
      }
      .channel-row img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        background: #061318;
        border-radius: 4px;
        flex-shrink: 0;
      }
      .channel-row .num {
        color: #5c7780;
        font-size: 0.75rem;
        min-width: 2rem;
        flex-shrink: 0;
      }
      .channel-row .name {
        color: #e6f1f4;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .player-pane { display: flex; flex-direction: column; }
      app-player { flex: 0 0 auto; }
      .epg { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
      .epg ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex: 1; }
      .epg li { padding: 0.7rem 1rem; border-bottom: 1px solid #0e2028; }
      .epg li.now {
        background: #11303a;
        border-left: 3px solid #4dd0c8;
        padding-left: calc(1rem - 3px);
      }
      .epg .time { font-size: 0.75rem; color: #5c7780; margin-bottom: 0.2rem; }
      .epg .title { font-size: 0.9rem; color: #e6f1f4; }
      .placeholder { display: grid; place-items: center; height: 100%; color: #5c7780; }
      .empty { padding: 1rem; color: #5c7780; font-size: 0.85rem; text-align: center; }
    `,
  ],
})
export class LiveTvComponent implements OnInit {
  private xtream = inject(XtreamService);

  categories = signal<XtreamCategory[]>([]);
  channels = signal<XtreamLiveStream[]>([]);
  selectedCategoryId = signal<string | null>(null);
  selectedChannel = signal<XtreamLiveStream | null>(null);
  epg = signal<XtreamEpgEntry[]>([]);
  loadingChannels = signal(false);
  streamUrl = signal('');

  catSearch = signal('');
  chSearch = signal('');

  filteredCategories = computed(() => {
    const q = this.catSearch().toLowerCase().trim();
    return q
      ? this.categories().filter((c) => c.category_name.toLowerCase().includes(q))
      : this.categories();
  });

  filteredChannels = computed(() => {
    const q = this.chSearch().toLowerCase().trim();
    return q
      ? this.channels().filter((c) => c.name.toLowerCase().includes(q))
      : this.channels();
  });

  trackCat = (_: number, c: XtreamCategory) => c.category_id;
  trackCh = (_: number, c: XtreamLiveStream) => c.stream_id;

  async ngOnInit(): Promise<void> {
    const cats = await firstValueFrom(this.xtream.getLiveCategories());
    this.categories.set(cats);
    if (cats.length) this.selectCategory(cats[0].category_id);
  }

  async selectCategory(id: string): Promise<void> {
    this.selectedCategoryId.set(id);
    this.chSearch.set('');
    this.loadingChannels.set(true);
    try {
      const list = await firstValueFrom(this.xtream.getLiveStreams(id));
      this.channels.set(list);
    } finally {
      this.loadingChannels.set(false);
    }
  }

  async selectChannel(ch: XtreamLiveStream): Promise<void> {
    this.selectedChannel.set(ch);
    this.streamUrl.set(this.xtream.getLiveStreamUrl(ch.stream_id));
    try {
      const epg = await firstValueFrom(this.xtream.getShortEpg(ch.stream_id, 5));
      this.epg.set(epg.epg_listings ?? []);
    } catch {
      this.epg.set([]);
    }
  }

  formatTime(unix: string): string {
    return new Date(parseInt(unix, 10) * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  decode(b64: string): string {
    return XtreamService.decodeEpgText(b64);
  }
}
