import { ApplicationCommandData, CommandInteraction } from 'discord.js';
import SlashCommandInterface from '../SlashCommandInterface';
import embedFactory from '../../Factory/messageEmbedFactory';
import validateCanGetPlayer from '../../Validation/validateCanGetPlayer';
import { injectable } from 'tsyringe';

@injectable()
export default class MoveCommand implements SlashCommandInterface {
  async execute(interaction: CommandInteraction): Promise<void> {
    const player = await validateCanGetPlayer(interaction);
    if (player === false) {
      return;
    }

    const item = interaction.options.getInteger('item', true).valueOf();
    const newPosition = interaction.options.getInteger('new_position', true).valueOf();

    await interaction.deferReply();

    const success = await player.move(item, newPosition);

    if (success === true) {
      const answer = embedFactory(interaction.client, 'Moved item!');

      await interaction.editReply({ embeds: [answer] });
      return;
    }

    const answer = embedFactory(interaction.client, 'That item does not exists!');

    await interaction.editReply({ embeds: [answer] });
  }

  getData(): ApplicationCommandData {
    return {
      name: 'move',
      description: 'move a queue item to another position',
      options: [
        {
          name: 'item',
          description: 'the song to be moved',
          type: 4,
          required: true,
        },
        {
          name: 'new_position',
          description: 'The new position. 0 or a negative number will put the item at the start.',
          type: 4,
          required: true,
        },
      ],
    };
  }
}
