const dotenv = require('dotenv')
dotenv.config()

const { SlashCommandBuilder } = require('@discordjs/builders')
const { REST } = require('@discordjs/rest')
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN)
const { Routes } = require('discord-api-types/v9')
const fs = require('fs')
const path = require('path')

let commands = []
fs.readdirSync(path.join(__dirname + `/commands`)).filter(cmd => cmd.endsWith('.js')).forEach(cmd => {
    let cmdData = require(path.join(__dirname + `/commands/${cmd}`))
	if (cmdData.devServerOnly) return;
	cmd = new SlashCommandBuilder().setName(cmdData.name).setDescription(cmdData.description);
	if (cmdData.options) {
		let { options } = cmdData;
		options.forEach((option1) => {
			let opt;

			switch(option1.type) {
				case 'string':
					cmd.addStringOption(option => {
						opt = option
						if (option1.choices) option1.choices.forEach(choice => opt.addChoices({ name: choice.name, value: choice.value }));
						return option
					})
					break
				case 'integer':
					cmd.addIntegerOption(option => opt = option)
					break
				case 'boolean':
					cmd.addBooleanOption(option => opt = option)
					break
				case 'user':
					cmd.addUserOption(option => opt = option)
					break
				case 'channel':
					cmd.addChannelOption(option => opt = option)
					break
				case 'role':
					cmd.addRoleOption(option => opt = option)
					break
				case 'mentionable':
					cmd.addMentionableOption(option => opt = option)
					break
				case 'number':
					cmd.addNumberOption(option => opt = option)
					break
				case 'attachment':
					cmd.addAttachmentOption(option => opt = option)
					break
			}

			if (!option1.name) return
			opt.setName(option1.name)
			if (option1.description) opt.setDescription(option1.description)
			if (option1.required) opt.setRequired(true)
		})
	}

    commands.push(cmd.toJSON())
});

(async () => {
	try {
		console.log('Started refreshing application global (/) commands.');

		await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
		);

		console.log('Successfully reloaded application global (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();