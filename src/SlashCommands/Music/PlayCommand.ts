import { CommandInteraction, User } from 'discord.js';
import AbstractSlashCommand from '../AbstractSlashCommand';
import MusicPlayerRepository from '../../MusicPlayer/MusicPlayerRepository';
import embedFactory from '../../Factory/messageEmbedFactory';
import Url from 'url-parse';
import { YtResult } from '../../types';
import ytpl, { Item as plItem } from 'ytpl';
import ytsr, { Item } from 'ytsr';

export default class PlayCommand extends AbstractSlashCommand {
  private requester: User;

  constructor() {
    super({
      name: 'play',
      description: 'Play some YT video',
      options: [
        {
          name: 'query',
          description: 'Search Query / Youtube URL',
          type: 3,
          required: true,
        },
      ],
    });
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    if (
      interaction.guild === null ||
      (interaction.channel.type !== 'GUILD_TEXT' && interaction.channel.type !== 'GUILD_PUBLIC_THREAD')
    ) {
      const answer = embedFactory(interaction.client, 'Error');
      answer.setDescription('Command can not be executed inside DMs!');
      await interaction.reply({ embeds: [answer], allowedMentions: { repliedUser: true }, ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user);

    if (member.voice.channel === null) {
      const answer = embedFactory(interaction.client, 'Error');
      answer.setDescription('You must be in a voice channel');
      await interaction.reply({ embeds: [answer], allowedMentions: { repliedUser: true }, ephemeral: true });
      return;
    }

    const query = interaction.options.getString('query', true);

    if (!MusicPlayerRepository.has(interaction.guild.id)) {
      MusicPlayerRepository.create(member.voice.channel, interaction.channel);
    }

    await interaction.deferReply();

    const player = MusicPlayerRepository.get(interaction.guild.id);

    if (member.voice.channelId !== player.getVoiceChannelId()) {
      const answer = embedFactory(interaction.client, 'Error');
      answer.setDescription('You must be in the same voice channel as iam in');
      await interaction.reply({ embeds: [answer], allowedMentions: { repliedUser: true }, ephemeral: true });
      return;
    }

    this.requester = interaction.user;

    const parsedUrls = await this.parseQuery(query);

    for (const parsedUrl of parsedUrls) {
      await player.addToQueue(parsedUrl);
    }

    const answer = embedFactory(interaction.client, 'Added to Queue!');

    await interaction.editReply({ embeds: [answer] });
  }

  private async parseQuery(query: string): Promise<YtResult[]> {
    let url;

    try {
      url = Url(query, true);
    } catch (e) {
      return [];
    }

    switch (true) {
      case ((url.pathname === '/watch' || url.pathname === '/playlist') && url.host === 'www.youtube.com' && url.query.list !== undefined):
        return await this.getAllUrlsFromPlaylist(url.query.list);
      case (url.pathname === '/watch' && url.host === 'www.youtube.com' && url.query.v !== undefined):
        return [await this.searchForVideoById(url.query.v)];
      default:
        return [await this.searchForVideoByQuery(query)];
    }
  }

  private async getAllUrlsFromPlaylist(listId: string): Promise<YtResult[]> {
    const result = await ytpl(listId, { limit: 999 });

    return result.items.map((item: plItem) => {
      return {
        url: item.shortUrl,
        title: item.title,
        uploader: item.author.name,
        ytId: item.id,
        requestedBy: this.requester.id,
      };
    });
  }

  private async searchForVideoByQuery(query: string): Promise<YtResult> {
    const result = await ytsr(query, { limit: 1 });
    const item = result.items[0];

    if (item.type !== 'video') {
      return;
    }

    return {
      url: item.url,
      title: item.title,
      uploader: item.author.name,
      ytId: item.id,
      requestedBy: this.requester.id,
    };
  }

  private async searchForVideoById(id: string): Promise<YtResult> {
    const result = await ytsr(id, { limit: 10 });

    const item = result.items.filter((item: Item) => {
      if (item.type !== 'video') {
        return false;
      }

      return item.id === id;
    })[0];
    if (item.type !== 'video') {
      return;
    }

    return {
      url: item.url,
      title: item.title,
      uploader: item.author.name,
      ytId: item.id,
      requestedBy: this.requester.id,
    };
  }
}
