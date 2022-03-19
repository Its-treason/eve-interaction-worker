import { ApplicationCommandData, CommandInteraction } from 'discord.js';
import SlashCommandInterface from '../SlashCommandInterface';
import embedFactory from '../../Factory/messageEmbedFactory';
import { QueueItem } from '../../types';
import validateCanGetPlayer from '../../Validation/validateCanGetPlayer';
import { injectable } from 'tsyringe';

@injectable()
export default class QueueCommand implements SlashCommandInterface {
  async execute(interaction: CommandInteraction): Promise<void> {
    const player = await validateCanGetPlayer(interaction, false);
    if (player === false) {
      return;
    }

    const items = player.getQueue();
    const pointer = player.getPointer();
    const startItemPointer = (interaction.options.getInteger('offset') || (pointer - 1)) - 1;

    if (items.length === 0) {
      const answer = embedFactory(interaction.client, 'Queue is empty');
      await interaction.reply({ embeds: [answer] });
      return;
    }

    const queue = this.createQueueMessage(items, startItemPointer, pointer);

    await interaction.reply({ content: queue });
  }

  createQueueMessage(items: QueueItem[], startItemPointer: number, pointer: number): string {
    let queue = '```nim\n';

    if (startItemPointer < 0) {
      startItemPointer = 0;
    }

    for (let i = startItemPointer; i < items.length; i++) {
      let itemString = `${i + 1}> ${items[i].title} uploaded by ${items[i].uploader}\n`;

      if (i === pointer) {
        const intend = ' '.repeat(`${pointer}`.length + 2);

        itemString = `${intend}⬐ current track\n${itemString}${intend}⬑ current track\n`;
      }

      if ((queue + itemString).length > 1950) {
        break;
      }
      queue += itemString;
    }

    return queue + '\n```';
  }

  getData(): ApplicationCommandData {
    return {
      name: 'queue',
      description: 'Get current queue',
      options: [
        {
          name: 'offset',
          description: 'Position from where to show the queue',
          type: 4,
        },
      ],
    };
  }
}
