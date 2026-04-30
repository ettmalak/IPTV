import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import Hls from 'hls.js';

@Component({
  selector: 'app-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="player-wrap">
      <video #video controls autoplay playsinline></video>
      @if (title()) {
        <div class="overlay-title">{{ title() }}</div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; background: #000; }
      .player-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #000;
      }
      video { width: 100%; height: 100%; display: block; }
      .overlay-title {
        position: absolute;
        top: 1rem;
        left: 1rem;
        padding: 0.4rem 0.8rem;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border-radius: 6px;
        font-size: 0.85rem;
        pointer-events: none;
      }
    `,
  ],
})
export class PlayerComponent implements OnDestroy {
  src = input.required<string>();
  type = input<'live' | 'vod'>('live');
  title = input<string>('');

  @ViewChild('video', { static: true })
  videoRef!: ElementRef<HTMLVideoElement>;

  private hls: Hls | null = null;

  constructor() {
    effect(() => {
      const url = this.src();
      if (url) this.load(url);
    });
  }

  private load(url: string): void {
    this.destroyHls();
    const video = this.videoRef.nativeElement;

    const isHls = url.endsWith('.m3u8') || this.type() === 'live';

    if (isHls && Hls.isSupported()) {
      this.hls = new Hls({
        // performance: parsing in worker thread - keeps UI smooth
        enableWorker: true,
        // buffering tuned for IPTV - smaller = less memory + faster channel switch
        backBufferLength: 10,
        maxBufferLength: 15,
        maxMaxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000, // 30MB
        // live tuning
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        // quality: auto, tested
        startLevel: -1,
        testBandwidth: true,
      });
      this.hls.loadSource(url);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          // try to recover from common errors before giving up
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              this.hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              this.hls?.recoverMediaError();
              break;
            default:
              console.error('HLS fatal:', data.type, data.details);
              this.destroyHls();
          }
        }
      });
    } else {
      // direct file (mp4, mkv) or native HLS support (Edge/Safari)
      video.src = url;
      video.load();
    }

    video.play().catch(() => {
      /* autoplay attribute usually handles this; ignore promise rejection */
    });
  }

  private destroyHls(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyHls();
  }
}
