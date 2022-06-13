const { MessageEmbed } = require('discord.js');
const { Database } = require("@devsnowflake/quick.db");
const db = new Database("./data.db");
const package = require('../../package.json');
const { names } = require('../clusterNames.json');
const moment = require('moment');

module.exports = {
    name: 'stats',
    description: 'Shows the bot\'s statistics.',
    category: 'general',
    dm: true,
    async execute (interaction) {
        await interaction.deferReply();

        let cmdsExecuted = await db.get('cmdsExecuted');
        if (!cmdsExecuted) cmdsExecuted = 0;

        let shardServers = await interaction.client.shard.fetchClientValues('guilds.cache.size');
        let uptime = moment.duration(interaction.client.uptime).humanize();

        let embed = new MessageEmbed()
            .setTitle('<:ping:980498628743422002> Stats')
            .setColor('#ff5100')
            .setDescription(`
**<:developer:980499908836593664> Developers:**
    LosingEnergy#2874 (ID: 862748332723404840)
\u200B
**Commands executed:** ${cmdsExecuted}
**Servers:** ${shardServers.reduce((prev, v) => prev + v)}
**Version:** ${package.version}
**Clusters:** ${interaction.client.shard.clusterCount}
**Shards:** ${interaction.client.shard.shardCount}
\u200B
**<:online:980498534228983848> Shard Stats:**
\`\`\`haxe
ID: #${interaction.guild.shardId}
Cluster: ${names[interaction.client.shard.id]}
Uptime: ${uptime}
Servers: ${interaction.client.guilds.cache.size}
Ping: ${Math.round(interaction.client.ws.ping)}ms
Voice Connections: ${interaction.client.voice.adapters.size}\`\`\`
            `)
        await interaction.editReply({ embeds: [embed] });
    }
}