const Lock = require("../handlers/Lock");
const Music = require("../handlers/Music");
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Locks the bot for maintenance.',
    category: 'music',
    options: [{
        type: 'boolean',
        name: 'lock',
        description: 'Lock the bot?',
        required: true,
    }],
    devServerOnly: true,
    async execute (interaction) {
        await interaction.deferReply();

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`This command can only be run by the developers.`)
        if (interaction.member.id !== "862748332723404840") return await interaction.editReply({ embeds: [embed] });
        
        let boolean = await interaction?.options?.getBoolean('lock');

        let status = await Lock.set(boolean);

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`The bot has been **${status ? 'locked' : 'unlocked'}**.`)
        await interaction.editReply({ embeds: [embed] });
    }
}