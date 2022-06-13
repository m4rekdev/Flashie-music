const dotenv = require('dotenv')
dotenv.config()

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

const { Intents } = require('discord.js');

const { ShardingManager } = require('kurasuta');
const path = require('path');

const sharder = new ShardingManager(path.join(__dirname, 'app'), {
    clientOptions: {
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
    },
    token: process.env.TOKEN,
});

sharder.on('ready', (cluster) => {
    console.log(`[kurasuta] Cluster #${cluster.id} is ready!`);
})
sharder.on('shardReady', (shardID) => console.log(`[kurasuta] Shard #${shardID} is ready!`))

sharder.spawn();
