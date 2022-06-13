const { MessageEmbed } = require('discord.js');
const Lock = require('../handlers/Lock');
const { Database } = require("@devsnowflake/quick.db");
const db = new Database("./data.db");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        let lockStatus = await Lock.get();
        await db.add('cmdsExecuted', 1);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`The bot is locked for maintenance.`)
        if (lockStatus && interaction.member.id !== "862748332723404840") return await interaction.reply({ embeds: [embed] })

        let command = await interaction.client.commands.get(interaction.commandName);

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`This command can only be run in a server.`)
        if (!command?.dm && !interaction.guild) return await interaction.reply({ embeds: [embed] })
        
        await command.execute(interaction);
    }
}
