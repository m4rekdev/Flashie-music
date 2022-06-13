const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Shows the bot\'s commands.',
    category: 'general',
    dm: true,
    async execute (interaction) {
        await interaction.deferReply();

        let categories = [];
        let commands = interaction.client.commands

        let categories2 = [... new Set(commands.map(cmd => cmd.category))];
        categories2.forEach((category, i) => {
            let cmds = commands.filter(cmd => cmd.category === category);
            let formatted = [];
            cmds.forEach((cmd, i) => formatted.push(`\`${cmd.name}\``));
            categories.push({ name: category, commands: formatted });
        });

		let embed = new MessageEmbed()
			.setColor('#ff5100')
			.setTitle('Commands')
            .setThumbnail(interaction.client.user.displayAvatarURL())

        categories.forEach(category => embed.addFields({ name: category.name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()), value: category.commands.join(', ') }))

        let row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setLabel('Website')
					.setURL('https://flashie.tk')
					.setStyle('LINK'),
				new MessageButton()
					.setLabel('Support Server')
					.setURL('https://go.flashie.tk/support')
					.setStyle('LINK'),
				new MessageButton()
					.setLabel('Invite me!')
					.setURL('https://go.flashie.tk/invite')
					.setStyle('LINK'),
				// new MessageButton()
				// 	.setLabel('Vote for me!')
				// 	.setURL('https://go.flashie.tk/vote')
				// 	.setStyle('LINK')
			);

        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}
