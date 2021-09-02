import {CommandInteraction, MessageActionRow, MessageButton} from 'discord.js';
import {EveSlashCommand} from '../types';
import embedFactory from '../util/embedFactory';
import {Aggregate} from '../eventStore/Aggregate';
import {EventStore} from '../eventStore/EventStore';

const banCommand: EveSlashCommand = {
  data: {
    name: 'ban',
    description: 'Ban a user',
    options: [
      {
        name: 'user',
        description: 'User to Ban',
        type: 6,
        required: true,
      },
      {
        name: 'reason',
        description: 'Ban reason',
        type: 3,
      },
    ],
  },
  permissions: ['BAN_MEMBERS'],
  allowDms: false,
  async execute(interaction: CommandInteraction) {
    const user = interaction.options.get('user').user;
    const reason = interaction.options.get('reason')?.value as string || 'No reason given';

    let banInfo;
    try {
      banInfo = await interaction.guild.bans.fetch({user, force: true});
    } catch (e) {
      if (e.message !== 'Unknown Ban') {
        throw e;
      }
    }

    if (banInfo !== undefined) {
      const answer = embedFactory();
      answer.setTitle('Error');
      answer.setDescription(`${user} is already banned in this guild!`);
      answer.addField('Ban reason', banInfo.reason);
      await interaction.reply({embeds: [answer], allowedMentions: {repliedUser: true} });
      return;
    }

    const aggregate = Aggregate.createNew();
    const event = await aggregate.record(
      'ban-interaction.create',
      {userId: interaction.user.id, targetUserId: user.id, reason: reason},
    );

    const answer = embedFactory();
    answer.setTitle('Ban');
    answer.setDescription(`Are u sure u want to ban ${user}?`);

    const row = new MessageActionRow()
      .addComponents(new MessageButton()
          .setCustomId(`ban-${event.getEventId()}`)
          .setLabel('Ban')
          .setStyle('DANGER'),
      );

    await interaction.reply({embeds: [answer], components: [row], allowedMentions: {repliedUser: true} });

    setTimeout(() => {
      (async () => {
        const aggregate = await EventStore.loadAggregate(event.getEventId());

        if (await aggregate.getEventByTopic('ban-interaction.executed') !== null) {
          return;
        }

        await aggregate.record('ban-interaction.timedOut', {});

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

export default banCommand;
