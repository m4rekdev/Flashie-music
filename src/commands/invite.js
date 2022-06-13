const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Sends the bot\'s invite link.',
    category: 'general',
    dm: true,
    async execute (interaction) {
        await interaction.deferReply();

        let embed = new MessageEmbed()
            .setTitle(`Invite me!`)
            .setColor('#ff5100')
            .setDescription(`
            **Short link:** https://go.flashie.tk/invite
            **Discord Link:** https://discord.com/oauth2/authorize?client_id=974307001683312680&permissions=36965376&scope=bot%20applications.commands
            `)
        await interaction.editReply({ embeds: [embed] });
    }
}