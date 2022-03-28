import { injectable } from 'tsyringe';
import { MusicResult } from '../types';
import * as yasha from 'yasha';
import { MultiDownloader } from '../Util/MultiDownloader';

@injectable()
export default class MusicResultService {
  public async parseQuery(query: string, requesterId: string): Promise<MusicResult[]|false> {
    const resultTracks = await this.findResult(query);
    if (resultTracks === false) {
      return false;
    }

    const youtubeTracks = await this.convertToYoutubeTracks(resultTracks);
    return youtubeTracks.map(ytTrack => this.wrapYoutubeTrack(ytTrack, requesterId));
  }

  private async convertToYoutubeTracks(tracks: yasha.Track.Track[]): Promise<yasha.api.Youtube.Track[]> {
    const result: (yasha.api.Youtube.Track|false)[] = [];

    const multiDownloader = new MultiDownloader<yasha.api.Youtube.Track|false>(25);

    for (const track of tracks) {
      const trackPromise = this.trackToYoutubeTrack(track);

      result.push(...(await multiDownloader.download(trackPromise)));
    }

    result.push(...(await multiDownloader.flush()));

    return result.filter((item): item is yasha.api.Youtube.Track => item !== false);
  }

  private async trackToYoutubeTrack(track: yasha.Track.Track): Promise<yasha.api.Youtube.Track|false> {
    if (track instanceof yasha.api.Youtube.Track) {
      return track;
    }

    const searchResult = await yasha.api.Youtube.search(`${track.author} - ${track.title}`);
    if (!searchResult[0]) {
      return false;
    }

    return searchResult[0];
  }

  private async findResult(query: string): Promise<yasha.Track.Track[]|false> {
    const resolveResult = await yasha.Source.resolve(query);

    let searchResult: yasha.Track.TrackResults = null;
    if (resolveResult === null) {
      searchResult = await yasha.Source.Youtube.search(query);
      if (searchResult.length === 0) {
        return false;
      }

      return [searchResult[0]];
    }

    if (resolveResult instanceof yasha.Track.Track) {
      return [resolveResult];
    }

    // Resolve will only return the first 100 items of an playlist
    if (resolveResult instanceof yasha.api.Spotify.Playlist && resolveResult.length >= 100) {
      return yasha.api.Spotify.playlist(resolveResult.id);
    }

    return resolveResult;
  }

  private wrapYoutubeTrack(track: yasha.api.Youtube.Track, requesterId: string): MusicResult {
    return {
      title: track.title,
      ytId: track.id,
      requestedBy: requesterId,
      track,
      url: track.url,
      uploader: track.author,
    };
  }
}
