const { MessageEmbed } = require('discord.js');
const Lock = require('../handlers/Lock');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        let lockStatus = await Lock.get();

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`The bot is locked for maintenance.`)
        if (lockStatus && interaction.member.id !== "862748332723404840") return await interaction.reply({ embeds: [embed], ephemeral: true })

        let button = await interaction.client.buttons.get(interaction.component.customId);
        await button.execute(interaction);
    }
}