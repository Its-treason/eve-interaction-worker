import {EveSlashCommand} from '../types';
import {tmpdir} from 'os';
import {unlinkSync} from 'fs';
import {MessageAttachment, User} from 'discord.js';
import generateRandomString from '../util/generateRandomString';
import puppeteer from 'puppeteer';

const command: EveSlashCommand = {
  data: {
    name: 'bonk',
    description: 'Send a image of the "Go to Horny Jail" meme with users Avatars',
    options: [
      {
        name: 'bonkee',
        description: 'User to Bonk',
        type: 6,
        required: true,
      },
      {
        name: 'bonker',
        description: 'User thats Bonks',
        type: 6,
        required: false,
      },
      {
        name: 'title',
        description: 'A title for the image',
        type: 3,
        required: false,
      },
    ],
  },
  execute: async (interaction) => {
    const bonkee = interaction.options.get('bonkee').user;
    const bonker = interaction.options.get('bonker')?.user;
    const title = interaction.options.get('title')?.value || '';

    // Generating the image takes a few seconds, so we need to defer the reply
    await interaction.deferReply();

    const imageFilename = `${tmpdir()}/bonk_${generateRandomString()}.png`;

    let bonkerHtml = '';
    if (bonker instanceof User) {
      bonkerHtml = `
        <img
          style="position: fixed; width: 150px; top: 80px; left: 150px; border-radius: 50%;"
          src="https://cdn.discordapp.com/avatars/${bonker.id}/${bonker.avatar}.png?size=128"
        />
      `;
    }

    const bonkHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=windows-1252">
        </head>
        <body>
          <p>
            <img style="position: fixed; top: 0;left: 0;" src="https://i.imgflip.com/4aylx8.jpg" />
            
            <span style="position: fixed; top: 0;left: 0;width: 720px;text-align: center;font-size: 45px; font-family: Impact,Arial,Ubuntu,sans-serif;">
                ${title}
            </span>
            ${bonkerHtml}
            <img
              style="position: fixed; width: 150px; top: 250px; left: 460px; border-radius: 50%;"
              src="https://cdn.discordapp.com/avatars/${bonkee.id}/${bonkee.avatar}.png?size=128"
            />
          </p>
        </body>
      </html>
    `;

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setViewport({width: 720, height: 492});
      await page.setContent(bonkHtml);
      await page.screenshot({path: imageFilename});
      await browser.close();

      const attachment = new MessageAttachment(imageFilename);
      await interaction.editReply({files: [attachment]});
    } catch (error) {
      await interaction.editReply(`${interaction.user} there was an error while creating the image`);
    }

    unlinkSync(imageFilename);
  },
};

export default command;
