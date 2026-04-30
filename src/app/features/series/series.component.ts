import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  XtreamCategory,
  XtreamEpisode,
  XtreamSeries,
  XtreamSeriesInfo,
} from '../../core/models/xtream.models';
import { XtreamService } from '../../core/services/xtream.service';
import { PlayerComponent } from '../player/player.component';

const CARD_WIDTH = 180;
const CARD_HEIGHT = 290;

@Component({
  selector: 'app-series',
  standalone: true,
  imports: [PlayerComponent, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="series-layout">
      <aside class="categories">
        <header>Categories</header>
        <cdk-virtual-scroll-viewport itemSize="40" class="vlist">
          <div
            class="cat-row"
            [class.active]="!selectedCategoryId()"
            (click)="selectCategory(null)"
          >
            All
          </div>
          <div
            *cdkVirtualFor="let cat of categories(); trackBy: trackCat"
            class="cat-row"
            [class.active]="cat.category_id === selectedCategoryId()"
            (click)="selectCategory(cat.category_id)"
          >
            {{ cat.category_name }}
          </div>
        </cdk-virtual-scroll-viewport>
      </aside>

      <section class="content">
        @if (currentEpisode(); as ep) {
          <div class="player-wrap">
            <app-player [src]="streamUrl()" [type]="'vod'" [title]="ep.title" />
            <button class="back" (click)="closePlayer()">← Back</button>
          </div>
        } @else {
          @if (seriesInfo(); as info) {
            <div class="detail">
              <button class="back" (click)="seriesInfo.set(null)">← Back to series</button>
              <h2>{{ info.info.name }}</h2>
              @if (info.info.plot) {
                <p class="plot">{{ info.info.plot }}</p>
              }
              <div class="seasons">
                @for (season of info.seasons; track season.season_number) {
                  <div class="season">
                    <h3>Season {{ season.season_number }}</h3>
                    <ul>
                      @for (ep of info.episodes[season.season_number] ?? []; track ep.id) {
                        <li (click)="playEpisode(ep)">
                          <span class="ep-num">{{ ep.episode_num }}</span>
                          <span class="ep-title">{{ ep.title }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </div>
          } @else {
            <header class="grid-header">
              <h2>Series ({{ filteredSeries().length }})</h2>
              <input
                type="search"
                placeholder="Search…"
                (input)="search.set($any($event.target).value)"
              />
            </header>
            <cdk-virtual-scroll-viewport [itemSize]="cardHeight" class="grid-viewport">
              <div
                *cdkVirtualFor="let row of rows(); trackBy: trackRow"
                class="grid-row"
                [style.height.px]="cardHeight"
              >
                @for (s of row.items; track s.series_id) {
                  <button class="card" (click)="openSeries(s)">
                    @if (s.cover) {
                      <img
                        [src]="s.cover"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        (error)="$any($event.target).style.display='none'"
                      />
                    } @else {
                      <div class="placeholder">📚</div>
                    }
                    <div class="title">{{ s.name }}</div>
                  </button>
                }
              </div>
            </cdk-virtual-scroll-viewport>
          }
        }
      </section>
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .series-layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        height: 100%;
      }
      .categories {
        display: flex;
        flex-direction: column;
        border-right: 1px solid #112830;
        overflow: hidden;
      }
      .categories header {
        padding: 1rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #5c7780;
        border-bottom: 1px solid #112830;
      }
      .vlist { flex: 1; height: 100%; contain: strict; }
      .cat-row {
        height: 40px;
        padding: 0 1rem;
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 0.85rem;
        color: #a8c0c8;
      }
      .cat-row:hover { background: #0e2028; }
      .cat-row.active {
        background: #11303a;
        color: #4dd0c8;
        border-left: 3px solid #4dd0c8;
        padding-left: calc(1rem - 3px);
      }

      .content { display: flex; flex-direction: column; overflow: hidden; }
      .grid-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #112830;
      }
      .grid-header h2 { margin: 0; color: #e6f1f4; font-size: 1.1rem; }
      .grid-header input {
        padding: 0.5rem 0.8rem;
        background: #061318;
        border: 1px solid #1d3a44;
        border-radius: 6px;
        color: #e6f1f4;
        font-size: 0.85rem;
        min-width: 240px;
      }
      .grid-header input:focus { outline: none; border-color: #4dd0c8; }

      .grid-viewport { flex: 1; contain: strict; }
      .grid-row {
        display: flex;
        gap: 1rem;
        padding: 0 1rem;
      }
      .card {
        width: 164px;
        flex-shrink: 0;
        background: #08161c;
        border: 1px solid #112830;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        text-align: left;
        padding: 0;
        color: inherit;
        font: inherit;
        display: flex;
        flex-direction: column;
      }
      .card:hover { border-color: #4dd0c8; }
      .card img,
      .card .placeholder {
        width: 100%;
        aspect-ratio: 2 / 3;
        object-fit: cover;
        background: #061318;
        display: grid;
        place-items: center;
        font-size: 2rem;
      }
      .card .title {
        padding: 0.5rem;
        font-size: 0.8rem;
        color: #e6f1f4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .detail { padding: 1.5rem; overflow-y: auto; }
      .detail h2 { color: #e6f1f4; margin: 0.5rem 0 1rem; }
      .plot { color: #a8c0c8; line-height: 1.5; max-width: 800px; }
      .season { margin-top: 2rem; }
      .season h3 { color: #4dd0c8; font-size: 0.95rem; margin: 0 0 0.5rem; }
      .season ul {
        list-style: none;
        margin: 0;
        padding: 0;
        background: #08161c;
        border-radius: 8px;
        overflow: hidden;
      }
      .season li {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.7rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid #0e2028;
        font-size: 0.9rem;
      }
      .season li:last-child { border-bottom: none; }
      .season li:hover { background: #0e2028; }
      .ep-num { color: #5c7780; min-width: 2rem; font-size: 0.8rem; }
      .ep-title { color: #e6f1f4; }
      .player-wrap { padding: 1rem; }
      .back {
        margin: 1rem;
        padding: 0.5rem 1rem;
        background: transparent;
        border: 1px solid #1d3a44;
        border-radius: 6px;
        color: #a8c0c8;
        cursor: pointer;
      }
      .back:hover { border-color: #4dd0c8; color: #4dd0c8; }
    `,
  ],
})
export class SeriesComponent implements OnInit {
  private xtream = inject(XtreamService);

  cardHeight = CARD_HEIGHT;

  categories = signal<XtreamCategory[]>([]);
  series = signal<XtreamSeries[]>([]);
  selectedCategoryId = signal<string | null>(null);
  seriesInfo = signal<XtreamSeriesInfo | null>(null);
  currentEpisode = signal<XtreamEpisode | null>(null);
  streamUrl = signal('');
  search = signal('');
  viewportWidth = signal(window.innerWidth - 240 - 32);

  filteredSeries = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.series();
    return this.series().filter((s) => s.name.toLowerCase().includes(q));
  });

  rows = computed(() => {
    const cols = Math.max(1, Math.floor(this.viewportWidth() / CARD_WIDTH));
    const all = this.filteredSeries();
    const out: { id: string; items: XtreamSeries[] }[] = [];
    for (let i = 0; i < all.length; i += cols) {
      out.push({ id: String(i), items: all.slice(i, i + cols) });
    }
    return out;
  });

  trackCat = (_: number, c: XtreamCategory) => c.category_id;
  trackRow = (_: number, r: { id: string }) => r.id;

  @HostListener('window:resize')
  onResize() {
    this.viewportWidth.set(window.innerWidth - 240 - 32);
  }

  async ngOnInit(): Promise<void> {
    const [cats, list] = await Promise.all([
      firstValueFrom(this.xtream.getSeriesCategories()),
      firstValueFrom(this.xtream.getSeries()),
    ]);
    this.categories.set(cats);
    this.series.set(list);
  }

  async selectCategory(id: string | null): Promise<void> {
    this.selectedCategoryId.set(id);
    this.search.set('');
    const list = await firstValueFrom(
      id ? this.xtream.getSeries(id) : this.xtream.getSeries(),
    );
    this.series.set(list);
  }

  async openSeries(s: XtreamSeries): Promise<void> {
    const info = await firstValueFrom(this.xtream.getSeriesInfo(s.series_id));
    this.seriesInfo.set(info);
  }

  playEpisode(ep: XtreamEpisode): void {
    this.currentEpisode.set(ep);
    this.streamUrl.set(this.xtream.getSeriesEpisodeUrl(ep.id, ep.container_extension));
  }

  closePlayer(): void {
    this.currentEpisode.set(null);
    this.streamUrl.set('');
  }
}
