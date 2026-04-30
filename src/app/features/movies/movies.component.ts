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
import { XtreamCategory, XtreamVodStream } from '../../core/models/xtream.models';
import { XtreamService } from '../../core/services/xtream.service';
import { PlayerComponent } from '../player/player.component';

const CARD_WIDTH = 180; // including gap
const CARD_HEIGHT = 290;

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [PlayerComponent, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="movies-layout">
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
        @if (selectedMovie(); as m) {
          <div class="player-wrap">
            <app-player [src]="streamUrl()" [type]="'vod'" [title]="m.name" />
            <button class="back" (click)="closePlayer()">← Back to library</button>
          </div>
        } @else {
          <header class="grid-header">
            <h2>Movies ({{ filteredMovies().length }})</h2>
            <input
              type="search"
              placeholder="Search…"
              (input)="search.set($any($event.target).value)"
            />
          </header>

          <cdk-virtual-scroll-viewport
            [itemSize]="cardHeight"
            class="grid-viewport"
          >
            <div
              *cdkVirtualFor="let row of rows(); trackBy: trackRow"
              class="grid-row"
              [style.height.px]="cardHeight"
            >
              @for (m of row.items; track m.stream_id) {
                <button class="card" (click)="play(m)">
                  @if (m.stream_icon) {
                    <img
                      [src]="m.stream_icon"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      (error)="$any($event.target).style.display='none'"
                    />
                  } @else {
                    <div class="placeholder">🎬</div>
                  }
                  <div class="meta">
                    <div class="title">{{ m.name }}</div>
                    @if (m.rating_5based) {
                      <div class="rating">★ {{ m.rating_5based }}</div>
                    }
                  </div>
                </button>
              }
            </div>
          </cdk-virtual-scroll-viewport>
        }
      </section>
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .movies-layout {
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

      .grid-viewport {
        flex: 1;
        contain: strict;
      }
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
      .card .meta { padding: 0.5rem; }
      .card .title {
        font-size: 0.8rem;
        color: #e6f1f4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .card .rating {
        margin-top: 0.2rem;
        font-size: 0.7rem;
        color: #f4c34d;
      }

      .player-wrap { padding: 1rem; }
      .back {
        margin-top: 1rem;
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
export class MoviesComponent implements OnInit {
  private xtream = inject(XtreamService);

  cardHeight = CARD_HEIGHT;

  categories = signal<XtreamCategory[]>([]);
  movies = signal<XtreamVodStream[]>([]);
  selectedCategoryId = signal<string | null>(null);
  selectedMovie = signal<XtreamVodStream | null>(null);
  streamUrl = signal('');
  search = signal('');
  viewportWidth = signal(window.innerWidth - 240 - 32); // sidebar + padding

  filteredMovies = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.movies();
    return this.movies().filter((m) => m.name.toLowerCase().includes(q));
  });

  /** Group flat list into rows for the virtual viewport */
  rows = computed(() => {
    const cols = Math.max(1, Math.floor(this.viewportWidth() / CARD_WIDTH));
    const all = this.filteredMovies();
    const out: { id: string; items: XtreamVodStream[] }[] = [];
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
    const [cats, all] = await Promise.all([
      firstValueFrom(this.xtream.getVodCategories()),
      firstValueFrom(this.xtream.getVodStreams()),
    ]);
    this.categories.set(cats);
    this.movies.set(all);
  }

  async selectCategory(id: string | null): Promise<void> {
    this.selectedCategoryId.set(id);
    this.search.set('');
    const list = await firstValueFrom(
      id ? this.xtream.getVodStreams(id) : this.xtream.getVodStreams(),
    );
    this.movies.set(list);
  }

  play(m: XtreamVodStream): void {
    this.selectedMovie.set(m);
    this.streamUrl.set(this.xtream.getVodStreamUrl(m.stream_id, m.container_extension));
  }

  closePlayer(): void {
    this.selectedMovie.set(null);
    this.streamUrl.set('');
  }
}
