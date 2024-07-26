const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName('start').setDescription('Start the bot process'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop the bot process')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

let botProcess;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'start') {
    if (botProcess) {
      return interaction.reply('Bot process is already running.');
    }
    exec('cd Bot && node index.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return interaction.reply('Failed to start the bot process.');
      }
      botProcess = true;
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      interaction.reply('Bot process started.');
    });
  } else if (commandName === 'stop') {
    if (!botProcess) {
      return interaction.reply('Bot process is not running.');
    }
    exec('pkill node', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return interaction.reply('Failed to stop the bot process.');
      }
      botProcess = false;
      exec('cd ../', (cdError, cdStdout, cdStderr) => {
        if (cdError) {
          console.error(`exec error: ${cdError}`);
          return interaction.reply('Failed to change directory.');
        }
        console.log(`stdout: ${cdStdout}`);
        console.error(`stderr: ${cdStderr}`);
        interaction.reply('Bot process stopped and directory changed.');
      });
    });
  }
});

client.login(process.env.TOKEN);
