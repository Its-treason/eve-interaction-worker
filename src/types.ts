import {Channel, Client, Collection, GuildMember, Interaction, Message, PermissionString, Role, User} from 'discord.js';

export interface EveClient extends Client {
  commands?: Collection<string, EveCommand>;
}

export interface EveInteraction {
  name: string,
  execute: (args: string[], interaction: Interaction) => Promise<void>
}

export interface EveEvent {
  name: string,
  execute: (...payload: never) => Promise<void>
}

export interface EveCommand {
  name: string;
  alias: string[];
  permissions: PermissionString[];
  allowDms: boolean;
  execute: (message: Message, args: ParsedArg[], client: EveClient) => Promise<void>;
}

export type ParsedArg = (string|User|GuildMember|Channel|Role);
