declare module 'yasha' {
  import { Channel, VoiceBasedChannel } from 'discord.js';
  import { JoinConfig, VoiceConnectionState, VoiceConnection as DiscordVoiceConnection, PlayerSubscription, AudioPlayer } from '@discordjs/voice';
  import EventEmitter from 'events';

  namespace api {
    namespace Spotify {
      import { Track as TrackNs } from 'yasha';

      async function playlist(id: string, length?: number): Promise<Playlist|null>;
      async function album(id: string, length?: number): Promise<Playlist|null>;
      async function search(query: string, start: number = 0, length: number = 20): Promise<Results|never>;

      class Track extends TrackNs.Track {}

      class Results extends TrackNs.TrackResults {}

      class Playlist extends TrackNs.TrackPlaylist {
        public type: string;
        public id: string;
      }
    }

    namespace Youtube {
      import { Track as TrackNs } from 'yasha';

      async function playlist(id: string, limit?: number): Promise<Playlist|null>
      async function search(query: string, continuation?: string): Promise<Results|null>
      async function get(id: string): Promise<Track|null>

      class Track extends TrackNs.Track {}

      class Results extends TrackNs.TrackResults {}

      class Playlist extends TrackNs.TrackPlaylist {}
    }

    namespace SoundCloud {
      import { Track as TrackNs } from 'yasha';

      async function playlist(id: string, limit?: number): Promise<Playlist|null>
      async function search(query: string, offset?: number, limit: number = 20): Promise<Results|null>

      class Track extends TrackNs.Track {}

      class Results extends TrackNs.TrackResults {}

      class Playlist extends TrackNs.TrackPlaylist {}
    }

    namespace AppleMusic {
      import { Track as TrackNs } from 'yasha';

      async function playlist(id: string, limit?: number): Promise<Playlist|null>
      async function search(query: string, offset: number = 0, limit: number = 25): Promise<Results|null>

      class Track extends TrackNs.Track {}

      class Results extends TrackNs.TrackResults {}

      class Playlist extends TrackNs.TrackPlaylist {}
    }
  }

  namespace Source {
    async function resolve(input: string, weak: boolean = true): Promise<Track.TrackPlaylist|Track.Track>

    namespace Spotify {
      async function playlist(id: string, length?: number): Promise<api.Spotify.Playlist|null>
      async function album(id: string, length?: number): Promise<api.Spotify.Playlist|null>
      async function search(query: string, offset?: number, length?: number): Promise<api.Spotify.Results|null>
    }

    namespace Youtube {
      async function playlist(id: string, limit?: number): Promise<api.Youtube.Playlist|null>
      async function search(query: string, continuation?: string): Promise<api.Youtube.Results|null>
    }

    namespace Soundcloud {
      async function playlist(id: string, length?: number): Promise<api.SoundCloud.Playlist|null>
      async function search(query: string, continuation?: string): Promise<api.SoundCloud.Results|null>
    }

    namespace AppleMusic {
      async function playlist(id: string, length?: number): Promise<api.A.Playlist|null>
      async function search(query: string, continuation?: string): Promise<api.SoundCloud.Results|null>
    }

    class Error extends Error {}
  }

  namespace Track {
    class Track {
      public platform: string;
      public playable: boolean;
      public duration: number;
      public author: string;
      id: string;
      title: string;
      icons: TrackImage[];
      thumbnails: TrackImage[];

      constructor(platform: string)

      setOwner(name: string, icons: string): this

      setMetadata(id: string, title: string, duration: number, thumbnails: TrackImage[]): false

      setStreams(streams: TrackStreams): this

      setPlayable(playable: boolean): this

      async fetch(): Track

      async getStreams(): TrackStreams

      get url(): string

      equals(other): boolean
    }

    class TrackResults extends Array {
      async next(): Track
    }

    class TrackPlaylist extends TrackResults {
      public title: string;
      public description: string;

      setMetadata(title: string, description: string): this

      setFirstTrack(track: Track): this

      async next(): Track

      async load(): this

      get url(): string
    }

    interface Image {
      url: string,
      width: number,
      height: number,
    }

    class TrackImage {
      constructor(url: string, width: number, height: number)

      static from(array: Image[]): TrackImage[]
    }
  }

  interface TrackPlayerOptions {
    normalize_volume: boolean,
    external_encrypt: boolean,
    external_packet_send: boolean,
  }

  interface Subscription {
    unsubscribe: () => void,
  }

  class TrackPlayer extends EventEmitter {
    constructor(options?: TrackPlayerOptions)

    subscribe(connection: VoiceConnection): Subscription | never

    unsubscribe(subscription: Subscription): void

    play(track: Track): void

    start(): Promise<void>

    hasPlayer(): boolean

    isPaused(): boolean

    setPaused(paused: boolean): boolean

    setVolume(volume: number): number

    setBitrate(bitrate: number): number

    setRate(rate: number): number

    setTempo(tempo: number): number

    setTremolo(depth: number, rate: number): number

    // TODO: Better type
    setEqualizer(eqs: any): any

    seek(time: number): void

    getTime(): number

    getDuration(): number

    getFramesDropped(): number

    getTotalFrames(): number

    isCodecCopy(): boolean

    stop(): void

    cleanup(): void

    destroy(): void
  }

  class VoiceConnection extends DiscordVoiceConnection {
    constructor(channel: Channel, options?: Partial<JoinConfig>)

    rejoin(channel)

    ready(): void

    set state(state: VoiceConnectionState): void

    get state(): VoiceConnectionState

    destroy(adapter_available: boolean = true): void

    disconnect(): void

    static async connect(channel: VoiceBasedChannel, options: Partial<JoinConfig> = {}): Promise<VoiceConnection|never>

    static get(guild): VoiceConnection

    static disconnect(guild, options?: Partial<JoinConfig>): boolean|never
    
    public subscribe(player: AudioPlayer|TrackPlayer): PlayerSubscription | undefined
  }
}
