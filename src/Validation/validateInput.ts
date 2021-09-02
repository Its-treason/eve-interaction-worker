import {Validator} from '../types';
import {CommandInteraction, Guild, Message} from 'discord.js';
import embedFactory from '../util/embedFactory';

export default async function validateInput(
  guild: Guild,
  original: CommandInteraction|Message,
  ...validators: Validator[]
): Promise<boolean> {
  for (const validator of validators) {
    const result = await validator(guild);

    if (result.valid === false) {
      const answer = embedFactory();
      answer.setTitle('Error');
      answer.setDescription(result.msg || 'Unknown Error');
      await original.reply({embeds: [answer], allowedMentions: {repliedUser: true}, ephemeral: true});
      return false;
    }
  }

  return true;
}
