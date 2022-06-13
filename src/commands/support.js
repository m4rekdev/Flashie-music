const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'support',
    description: 'Sends an invite to the support server.',
    category: 'general',
    dm: true,
    async execute (interaction) {
        await interaction.deferReply();

        let embed = new MessageEmbed()
            .setTitle(`Support Server`)
            .setColor('#ff5100')
            .setDescription(`
            **Short link:** https://go.flashie.tk/support
            **Discord Link:** https://discord.gg/St3nuvajhW
            `)
        await interaction.editReply({ embeds: [embed] });
    }
}