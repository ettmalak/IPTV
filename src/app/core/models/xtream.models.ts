// ===== Login / Account =====
export interface XtreamLoginResponse {
  user_info: {
    username: string;
    password: string;
    message: string;
    auth: 0 | 1;
    status: 'Active' | 'Banned' | 'Disabled' | 'Expired' | string;
    exp_date: string | null; // unix timestamp as string
    is_trial: '0' | '1';
    active_cons: string;
    created_at: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: 'http' | 'https';
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
  };
}

// ===== Categories =====
export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

// ===== Live Stream / Channel =====
export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: 'live';
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: 0 | 1;
  direct_source: string;
  tv_archive_duration: number;
}

// ===== VOD (Movies) =====
export interface XtreamVodStream {
  num: number;
  name: string;
  stream_type: 'movie';
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface XtreamVodInfo {
  info: {
    movie_image: string;
    tmdb_id: string;
    backdrop_path: string[];
    youtube_trailer: string;
    genre: string;
    plot: string;
    cast: string;
    rating: string;
    director: string;
    releasedate: string;
    duration_secs: number;
    duration: string;
  };
  movie_data: {
    stream_id: number;
    name: string;
    container_extension: string;
  };
}

// ===== Series =====
export interface XtreamSeries {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    movie_image?: string;
    plot?: string;
    duration_secs?: number;
    duration?: string;
  };
  added: string;
  season: number;
}

export interface XtreamSeriesInfo {
  seasons: Array<{
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    season_number: number;
    cover: string;
  }>;
  info: XtreamSeries;
  episodes: Record<string, XtreamEpisode[]>; // keyed by season number
}

// ===== EPG =====
export interface XtreamEpgEntry {
  id: string;
  epg_id: string;
  title: string; // base64 encoded
  lang: string;
  start: string;
  end: string;
  description: string; // base64 encoded
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
  now_playing?: 0 | 1;
  has_archive?: 0 | 1;
}

// ===== Internal types =====
export interface XtreamCredentials {
  serverUrl: string; // e.g. http://example.com:8080
  username: string;
  password: string;
}
