const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Shows the bot\'s ping.',
    category: 'general',
    dm: true,
    async execute (interaction) {
        await interaction.deferReply();

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`🏓 **Pong!** My ping is \`${interaction.client.ws.ping}ms\`!`)
        await interaction.editReply({ embeds: [embed] });
    }
}
