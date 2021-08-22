import embedFactory from '../util/embedFactory';
import {ButtonInteraction, CommandInteraction} from 'discord.js';
import {MessageActionRow, MessageButton} from 'discord.js';
import {EveSlashCommand} from '../types';
import {EventStore} from '../eventStore/EventStore';
import {Aggregate} from '../eventStore/Aggregate';

const kickCommand: EveSlashCommand = {
  data: {
    name: 'kick',
    description: 'Kick a user',
    options: [
      {
        name: 'user',
        description: 'User to kick',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Kick reason',
        type: 3,
      },
    ],
  },
  permissions: ['KICK_MEMBERS'],
  allowDms: false,
  async execute(interaction: CommandInteraction) {
    const user = interaction.options.get('user').user;
    const reason = interaction.options.get('reason')?.value as string || 'No reason given';

    const answer = embedFactory();
    answer.setTitle('Kick');
    answer.setDescription(`Are u sure u want to kick ${user}?`);

    const aggregate = Aggregate.createNew();
    const event = await aggregate.record(
      'kick-interaction.create',
      {userId: interaction.user.id, targetUserId: user.id, reason},
    );

    const row = new MessageActionRow()
      .addComponents(new MessageButton()
          .setCustomId(`kick-${event.getEventId().toString()}`)
          .setLabel('Kick')
          .setStyle('DANGER'),
      );

    await interaction.reply({embeds: [answer], components: [row], allowedMentions: {repliedUser: true} });

    setTimeout(() => {
      (async () => {
        const aggregate = await EventStore.loadAggregate(event.getEventId());

        if (await aggregate.getEventByTopic('kick-interaction.executed') !== null) {
          return;
        }

        await aggregate.record('kick-interaction.timedOut', {});

        const row = new MessageActionRow()
          .addComponents(new MessageButton()
            .setCustomId('timedOut')
            .setLabel('Timed out')
            .setStyle('DANGER')
            .setDisabled(true),
          );

        await interaction.editReply({components: [row]});
      })();
    }, 60000);
  },
};

export default kickCommand;