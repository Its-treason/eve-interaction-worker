import embedFactory from '../Factory/messageEmbedFactory';
import AbstractSlashCommand from './AbstractSlashCommand';
import {CommandInteraction} from 'discord.js';

export default class InviteCommand extends AbstractSlashCommand {
  data;

  constructor() {
    super();

    this.data = {
      name: 'invite',
      description: 'Create an invite to invite the bot to your server',
      options: [],
    };
  }

  async execute(interaction: CommandInteraction): Promise<void> {
    const invite = interaction.client.generateInvite(
      {scopes: ['applications.commands'], permissions: 'ADMINISTRATOR'},
    );

    const answer = embedFactory();
    answer.setTitle('Invite Link');
    answer.setDescription(invite);
  }
}
