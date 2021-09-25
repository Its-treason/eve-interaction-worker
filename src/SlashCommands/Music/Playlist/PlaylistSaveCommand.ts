import { CommandInteraction } from 'discord.js';
import messageEmbedFactory from '../../../Factory/messageEmbedFactory';
import PlaylistProjection from '../../../Projection/PlaylistProjection';
import embedFactory from '../../../Factory/messageEmbedFactory';
import validateCanGetPlayer from '../../../Validation/validateCanGetPlayer';
import { YtResult } from '../../../types';
import AbstractSubSlashCommand from '../../AbstractSubSlashCommand';

export default class PlaylistSaveCommand extends AbstractSubSlashCommand {
  constructor(
    private playlistProjection: PlaylistProjection,
  ) {
    super({
      type: 1,
      name: 'save',
      description: 'Save the current queue as a Playlist',
      options: [
        {
          name: 'name',
          description: 'Name of the playlist',
          required: true,
          type: 3,
        },
      ],
    });
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const name = interaction.options.getString('name', true);
    const userId = interaction.user.id;

    if (name.length > 32) {
      const answer = embedFactory(interaction.client, 'Error');
      answer.setDescription('Name must not be longer than 32 characters!');
      await interaction.reply({ embeds: [answer], allowedMentions: { repliedUser: true }, ephemeral: true });
      return;
    }

    const player = await validateCanGetPlayer(interaction, false);
    if (player === false) {
      return;
    }

    const queue = player.getQueue();

    if (queue.length === 0) {
      const answer = embedFactory(interaction.client, 'Error');
      answer.setDescription('The queue is currently empty!');
      await interaction.reply({ embeds: [answer], allowedMentions: { repliedUser: true }, ephemeral: true });
      return;
    }

    const ytResultQueue = queue.map((queueItem): YtResult => {
      return {
        ytId: queueItem.ytId,
        url: queueItem.url,
        title: queueItem.title,
        uploader: queueItem.uploader,
        requestedBy: '',
      };
    });

    await this.playlistProjection.savePlaylist(name, userId, ytResultQueue);

    const answer = messageEmbedFactory(interaction.client, 'Saved Playlist!');

    await interaction.reply({ embeds: [answer] });
  }
}
