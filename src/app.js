const dotenv = require('dotenv')
dotenv.config()

const { BaseCluster } = require('kurasuta');
const { Collection, MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { names } = require('./clusterNames.json');
const { Manager } = require("erela.js");
const formatMsToDuration = require('./functions/formatMsToDuration.js');

const { Database } = require("@devsnowflake/quick.db");
const db = new Database("./data.db");

module.exports = class extends BaseCluster {
	launch() {
		this.client.login(process.env.TOKEN);

		fs.readdirSync(path.join(__dirname + `/events`)).filter(event => event.endsWith('.js')).forEach(event => {
			let eventData = require(path.join(__dirname + `/events/${event}`))
			if (eventData.once) {
				this.client.once(eventData.name, (...args) => eventData.execute(...args));
			} else {
				this.client.on(eventData.name, (...args) => eventData.execute(...args), );
			}
		})
		
		this.client.commands = new Collection();
		fs.readdirSync(path.join(__dirname + `/commands`)).filter(cmd => cmd.endsWith('.js')).forEach(cmd => {
			let cmdData = require(path.join(__dirname + `/commands/${cmd}`))
			this.client.commands.set(cmdData.name, cmdData)
		})
		
		this.client.buttons = new Collection();
		fs.readdirSync(path.join(__dirname + `/buttons`)).filter(btn => btn.endsWith('.js')).forEach(btn => {
			let btnData = require(path.join(__dirname + `/buttons/${btn}`))
			this.client.buttons.set(btnData.name, btnData)
		})

		let client = this.client;

		this.client.manager = new Manager({
			// An array of nodes. Note: You don't need to pass any if you are using the default values (ones shown below).
			nodes: [
			  // If you pass a object like so, the "host" property is required
			  {
				host: process.env.LAVA_HOST, // Optional if Lavalink is local
				port: parseInt(process.env.LAVA_PORT), // Optional if Lavalink is set to default
				password: process.env.LAVA_PASS, // Optional if Lavalink is set to default
			  },
			],
			// A send method which sends data to the Discord WebSocket using your library.
			send(id, payload) {
			  const guild = client.guilds.cache.get(id);
			  if (guild) guild.shard.send(payload);
			},
		  })
			.on("nodeConnect", node => console.log(`[Lavalink] Connected to ${node.options.host}:${node.options.port}.`))
			.on("nodeError", (node, error) => console.log(`[Lavalink] An error occurred with node ${node.options.host}: ${error.message}`))
			.on("trackStart", async (player, track) => {
				let duration = await formatMsToDuration(track.duration);
				let embed = new MessageEmbed()
                        .setTitle('<a:song:980829956152111124> Now Playing')
                        .setColor('#ff5100')
                        .addFields(
                            { name: 'Song Title', value: track.title, inline: true },
                            { name: 'Duration', value: `\`${track.isStream ? `🔴 Live` : duration}\``, inline: true },
                            { name: 'Requester', value: `${track.requester}`, inline: true },
                        )
                        .setImage(track.thumbnail)

				let guildsDb = db.createTable("guilds");
				let guild = this.client.guilds.cache.get(player.guild);

				let announceSongs = guildsDb.get(`${guild.id}.announceSongs`, true);
				if (!announceSongs) announceSongs = true;

				if (announceSongs) this.client.channels.cache
					.get(player.textChannel)
					.send({ embeds: [embed] });
			})
			.on("trackError", async (player, track) => {
				let embed = new MessageEmbed()
                        .setDescription('<:error:980498447536910446> An error occurred while playing the song! Skipping...')
                        .setColor('#ff5100')

				this.client.channels.cache
					.get(player.textChannel)
					.send({ embeds: [embed] });

				player.stop();
			})
			.on("trackStuck", async (player, track) => {
				let embed = new MessageEmbed()
                        .setDescription('<:error:980498447536910446> An error occurred while playing the song! Skipping...')
                        .setColor('#ff5100')

				this.client.channels.cache
					.get(player.textChannel)
					.send({ embeds: [embed] });

				player.stop();
			})

		this.client.once('ready', () => {
			this.client.user.setActivity(`•○• music •○• | Cluster: ${names[this.client.shard.id]}`)
			this.client.manager.init(this.client.user.id);
		});

		this.client.on("raw", (d) => this.client.manager.updateVoiceState(d));
	}
}