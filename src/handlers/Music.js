const dotenv = require('dotenv')
dotenv.config()

const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const shuffle = require('../functions/shuffle');
const formatMsToDuration = require('../functions/formatMsToDuration');
const move = require('../functions/move');
const titleCase = require('../functions/titleCase');
const getTrackIndex = require('../functions/getTrackIndex');

const { Database } = require("@devsnowflake/quick.db");
const db = new Database("./data.db");

class Music {
    async play({ song, vc, interaction, savedQueue }) {
        let guildsDb = db.createTable("guilds");
        let volume = await guildsDb.get(`${interaction.guild.id}.volume`);

        let player;
        let queue = [];
        
        if (!savedQueue) {
            let embed = new MessageEmbed()
                            .setColor('#ff5100')
                            .setDescription(`<a:loading:980499066821681172> Loading the song...`);
            await interaction.editReply({ embeds: [embed] });

            if (!vc) {
                let embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You have to join a voice channel or specify it before using this command!`);
                if (!interaction.member?.voice?.channel) return { embeds: [embed] };
                vc = await interaction.member.voice.channel;
            }
    
            embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> I can't join the voice channel! (Make sure that I have the \`CONNECT\`, \`SPEAK\` and \`USE_VOICE_ACTIVITY_DETECTION\` permissions)`);
            if (!interaction.guild.me.permissionsIn(vc).has('CONNECT') || !interaction.guild.me.permissionsIn(vc).has('SPEAK') ||!interaction.guild.me.permissionsIn(vc).has('USE_VAD')) return { embeds: [embed] };

            const res = await interaction.client.manager.search(
                song,
                interaction.member
            );
            
            player = interaction.client.manager.create({
                guild: interaction.guild.id,
                voiceChannel: vc.id,
                textChannel: interaction.channel.id,
            });

            if (!interaction.guild.musicData) interaction.guild.musicData = {
                queue: [],
                nowPlaying: null,
            };

            queue = await interaction.guild?.musicData.queue;
            if (!queue) queue = [];

            if (!interaction.guild.me.voice?.channel) {
                player.setVoiceChannel(vc.id);
                player.connect();
            };

            switch (res.loadType) {
                case "LOAD_FAILED":
                    embed = new MessageEmbed()
                        .setColor('#ff5100')
                        .setDescription(`<:error:980498447536910446> Couldn't get the song data!`);
                    return { embeds: [embed] }
                case "NO_MATCHES":
                    embed = new MessageEmbed()
                        .setColor('#ff5100')
                        .setDescription(`<:error:980498447536910446> Couldn't find anything matching to your search!`);
                    return { embeds: [embed] };
                case "PLAYLIST_LOADED":
                    embed = new MessageEmbed()
                        .setTitle('<a:song:980829956152111124> Added a Playlist to the Queue')
                        .setColor('#ff5100')
                        .addFields(
                            { name: 'Playlist Name', value: res.playlist.name, inline: true },
                            { name: 'Duration', value: `\`${await formatMsToDuration(res.playlist.duration)}\``, inline: true },
                        )

                    if (interaction.guild.musicData.queue.length) interaction.guild.musicData.queue.push(...res.tracks);
                    else queue.push(...res.tracks);

                    interaction.editReply({ embeds: [embed] });
                    break;
                case "TRACK_LOADED":
                case "SEARCH_RESULT":
                    embed = new MessageEmbed()
                        .setTitle('<a:song:980829956152111124> Added to Queue')
                        .setColor('#ff5100')
                        .addFields(
                            { name: 'Song Title', value: res.tracks[0].title, inline: true },
                            { name: 'Duration', value: `\`${res.tracks[0].isStream ? `🔴 Live` : await formatMsToDuration(res.tracks[0].duration)}\``, inline: true },
                            { name: 'Requester', value: `${res.tracks[0].requester}`, inline: true },
                        )
                        .setImage(res.tracks[0].thumbnail)

                    if (interaction.guild.musicData.queue.length) interaction.guild.musicData.queue.push(res.tracks[0]);
                    else queue.push(res.tracks[0]);
                        
                    if (interaction.guild.musicData.queue.length > 1) return { embeds: [embed] };
                    break;
            }
        } else {
            let embed = new MessageEmbed()
                            .setColor('#ff5100')
                            .setDescription(`<a:loading:980499066821681172> Loading the queue...`);
            await interaction.editReply({ embeds: [embed] });

            queue = await interaction.guild?.musicData.queue;
            if (!queue) queue = [];  

            savedQueue.queue.forEach(i => {
                if (interaction.guild.musicData.queue.length) interaction.guild.musicData.queue.push(i);
                else queue.push(i);
            });
            
            embed = new MessageEmbed()
                    .setTitle('<a:song:980829956152111124> A Saved Queue has been added to Queue')
                    .setColor('#ff5100')
                    .addFields(
                        { name: 'Name', value: savedQueue.name, inline: true },
                        { name: 'User', value: interaction.user.tag, inline: true },
                    )

            return { embeds: [embed] };
        }

        player.queue.add(interaction.guild.musicData.queue[0]);
        interaction.guild.musicData.nowPlaying = interaction.guild.musicData.queue[0];
        player.play();
        player.setVolume(volume ? volume : 0.5);

        interaction.client.manager.on('queueEnd', (player, track) => {
            let loop = db.get(`${interaction.guild.id}.loop`, "Disabled"),
                dontLeave = db.get(`${interaction.guild.id}.dontLeave`, false),
                announceSongs = db.get(`${interaction.guild.id}.announceSongs`, true)

            if (!loop) loop = "Disabled";
            if (!dontLeave) dontLeave = false;
            if (!announceSongs) announceSongs = true;

            if (getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) === interaction.guild.musicData.queue.length - 1 && loop === "Disabled") {
                interaction.guild.musicData.nowPlaying = null;
                interaction.guild.musicData.queue = [];

                let channel = interaction.client.channels.cache.get(player.textChannel);

                if (!dontLeave) player.disconnect();
                
                let embed = new MessageEmbed()
					.setDescription('<:info:980827075038547998> Queue ended.')
					.setColor('#ff5100')
				
				channel.send({ embeds: [embed] });
            }

            if (loop === "Queue") {
                let embed = new MessageEmbed()
                    .setDescription(`<:info:980827075038547998> Repeating the queue.`)
                    .setColor('#ff5100')

                interaction.client.channels.cache
                    .get(player.textChannel)
                    .send({ embeds: [embed] });
                
                player.play(interaction.guild.musicData.queue[0]);
                return interaction.guild.musicData.nowPlaying = interaction.guild.musicData.queue[0];
            }

            if (loop === "Track") {
                return player.play(track);
            }

            player.queue.add(interaction.guild.musicData.queue[getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) + 1]);
            interaction.guild.musicData.nowPlaying = interaction.guild.musicData.queue[getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) + 1];
            player.play();
        })
    }

    async pause({ interaction }) {
        let player = interaction.client.manager.get(interaction.guild.id);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        
        if (!player.queue.totalSize) return { embeds: [embed] };

        if (player.playing) {
            player.pause(true);
        } else if (player.paused) {
            player.pause(false);
        }

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> The playback has been **${player.paused ? 'paused' : 'unpaused'}**.`)
        return { embeds: [embed] };
    }

    async stop(interaction) {
        let player = interaction.client.manager.get(interaction.guild.id);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        if (!player?.queue.totalSize) return { embeds: [embed] };

        interaction.guild.musicData.nowPlaying = null;
        interaction.guild.musicData.queue = [];

        player.stop();
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> The playback has been stopped and the queue has been cleared.`)
        return { embeds: [embed] };
    }

    async queue({ interaction, page }) {
        let queueBtnTimeout = await db.get(`${interaction.guild.id}.queueBtnTimeout`);
        if (queueBtnTimeout) clearTimeout(queueBtnTimeout);

        let player = interaction.client.manager.get(interaction.guild.id);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        if (!player?.queue.totalSize) return { embeds: [embed] };

        let loop = await db.get(`${interaction.guild.id}.loop`, "Disabled"),
            dontLeave = await db.get(`${interaction.guild.id}.dontLeave`, false)

        if (!loop) loop = "Disabled";
        if (!dontLeave) dontLeave = false;

        let { queue, nowPlaying } = interaction.guild.musicData;

        if (!page) page = 1;

        let queueParsed = queue.slice(process.env.QUEUE_SONGS_PER_PAGE * (page - 1), process.env.QUEUE_SONGS_PER_PAGE * page)
        
        queueParsed.forEach((song, i) => {
            queueParsed[i] = `**#${getTrackIndex(song, interaction) + 1}** | ${song.title} | ${song.requester}`;
            if (song === nowPlaying) queueParsed[i] = '` Playing >>> ` ' + queueParsed[i];
        });

        const row = new MessageActionRow()
			.addComponents(
                new MessageButton()
					.setCustomId('queuePrevPage')
					.setLabel(`Previous Page${ (page - 1) ? ` (Page ${page - 1})` : `` }`)
					.setStyle('PRIMARY'),
				new MessageButton()
					.setCustomId('queueNextPage')
					.setLabel(`Next Page (Page ${page + 1})`)
					.setStyle('PRIMARY'),
			);

        if (page <= 1) row.components[0].setDisabled(true);
        if (Math.ceil(queue.length / process.env.QUEUE_SONGS_PER_PAGE) <= page) row.components[1].setDisabled(true);

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setTitle('<:queue:980829938712199228> Queue')
            .setDescription(`${queueParsed.join('\n')}`)
            .addFields(
                { name: 'Volume', value: player.volume + '%', inline: true },
                { name: 'Loop', value: loop, inline: true },
                { name: '24/7 Mode', value: dontLeave ? 'Enabled' : 'Disabled', inline: true },
            )
            .setFooter({ text: `Songs in queue: ${queue.length} | Page: ${page}/${Math.ceil(queue.length / process.env.QUEUE_SONGS_PER_PAGE)} | Songs per page: ${process.env.QUEUE_SONGS_PER_PAGE}` })

        let btnTimeout = setTimeout(() => {
            row.components.forEach(component => component.setDisabled(true));
            interaction.editReply({ components: [row] })
            db.delete(`${interaction.guild.id}.queueBtnTimeout`);
        }, 10000);

        await db.set(`${interaction.guild.id}.queueBtnTimeout`, btnTimeout[Symbol.toPrimitive]());

        return { embeds: [embed], components: [row] };
    }

    async volume({ interaction, volume }) {
        let guildsDb = db.createTable("guilds");

        let player = interaction.client.manager.get(interaction.guild.id);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        if (!player?.queue.totalSize) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:info:980827075038547998> Current volume is **${player.volume * 100}%**.`)
        if (!volume) return { embeds: [embed] };
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> You cannot set a volume lower than 1, higher than 100 or the same as it already is.`)
        if (volume > 100 || volume < 1 || volume === player.volume) return { embeds: [embed] };

        player.setVolume(volume / 100);
        await guildsDb.set(`${interaction.guild.id}.volume`, volume);

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> Volume has been set to **${volume}%**.`)
       return { embeds: [embed] };
    }

    async skip({ interaction, songsToSkip }) {
        let player = interaction.client.manager.get(interaction.guild.id);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        if (!interaction.guild.musicData?.queue.length) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> You can't skip more songs than there are left to play!`)
        if (songsToSkip > (interaction.guild.musicData.queue.length - getTrackIndex(interaction.guild.musicData.nowPlaying, interaction))) return { embeds: [embed] };

        interaction.guild.musicData.nowPlaying = interaction.guild.musicData.queue[getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) + songsToSkip];
        player.stop();
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> **${songsToSkip} ${songsToSkip === 1 ? `song** has` : `songs** have`}  been skipped.`)
        return { embeds: [embed] };
    }

    async back({ interaction, songsToGoBackBy }) {
        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };
        
        let player = interaction.client.manager.get(interaction.guild.id);

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> You can't go back by more songs than there are before the current song in the queue!`)
        if ((getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) - songsToGoBackBy) < 0) return { embeds: [embed] };

        let song = interaction.guild.musicData.queue[getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) - songsToGoBackBy - 1];
        if (!song) song = {
            index: getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) - songsToGoBackBy - 1,
        }

        interaction.guild.musicData.nowPlaying = song;
        player.stop();
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> Went back by ${songsToGoBackBy} ${songsToGoBackBy === 1 ? 'song' : 'songs'}.`)
        return { embeds: [embed] };
    }

    async remove({ interaction, index }) {
        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        
        if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };
        
        let player = interaction.client.manager.get(interaction.guild.id);
        let { queue, nowPlaying } = await interaction.guild.musicData;

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The index can't be bigger than the queue length!`)
        if (index > queue.length) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> You can't remove the current song!`)
        if (queue[index - 1] === nowPlaying) return { embeds: [embed] };

        let removed = await queue.splice(index - 1, 1)[0];
        interaction.guild.musicData.queue = queue;

        if (index - 1 === getTrackIndex(interaction.guild.musicData.nowPlaying, interaction) || !queue.length) player.stop();
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> **${removed.title}** has been removed from the queue.`)
        return { embeds: [embed] };
    }

    async shuffle({ interaction }) {
        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        
        if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };
        
        let { queue } = await interaction.guild.musicData;

        interaction.guild.musicData.queue = await shuffle(queue, interaction);
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> The queue has been shuffled.`)
        return { embeds: [embed] };
    }

    async exchange({ interaction, index, toIndex }) {
        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        
        if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };
        
        let { queue, nowPlaying } = await interaction.guild.musicData;

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The index can't be bigger than the queue length or lower than 1!`)
        if (index > queue.length || index < 1 ) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The toIndex can't be bigger than the queue length or lower than 1!`)
        if (toIndex > queue.length || toIndex < 1 ) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The index and toIndex can't be the same!`)
        if (index === toIndex) return { embeds: [embed] };

        let song = queue[index - 1];
        let toSong = queue[toIndex - 1];

        queue[toIndex - 1] = song;
        queue[index - 1] = toSong;
        
        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> **${queue[toIndex - 1].title} (#${index})** has been exchanged with **${queue[index - 1].title} (#${toIndex})**.`)
        return { embeds: [embed] };
    }

    async move({ interaction, index, toIndex }) {
        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        
        if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };
        
        let { queue, nowPlaying } = await interaction.guild.musicData;

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The index can't be bigger than the queue length or lower than 1!`)
        if (index > queue.length || index < 1 ) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The toIndex can't be bigger than the queue length or lower than 1!`)
        if (toIndex > queue.length || toIndex < 1 ) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> The index and toIndex can't be the same!`)
        if (index === toIndex) return { embeds: [embed] };

        let moved = await move(queue, index - 1, toIndex - 1);
        interaction.guild.musicData.queue = moved.array;

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> **${moved.item.title}** has been moved to index **#${toIndex}**.`)
        return { embeds: [embed] };
    }

    async savedQueues({ interaction, action, name, page }) {
        let usersDb = db.createTable("users");

        let embed, queue, queues, includesComponents, row;

        switch(action) {
            case "save":
                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> Nothing is playing!`)
                if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };

                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You need to specify a name for the queue!`)
                if (!name) return { embeds: [embed] };

                queue = await usersDb.get(`${interaction.member.id}.savedQueues`)?.find(i => i.name === name);
                
                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You already have a saved queue with this name!`)
                if (queue) return { embeds: [embed] };

                queues = await usersDb.get(`${interaction.member.id}.savedQueues`);
                if (!queues?.length) queues = { length: 0 };

                let savedQueue = { name, queue: [...interaction.guild?.musicData?.queue], index: queues.length };

                await usersDb.push(`${interaction.member.id}.savedQueues`, savedQueue);

                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:success:980498418227114075> Succesfully saved the current queue.`)
                break
            
            case "list":
                let savedQueuesBtnTimeout = await db.get(`${interaction.member.id}.savedQueuesBtnTimeout`);
                if (savedQueuesBtnTimeout) clearTimeout(savedQueuesBtnTimeout);

                if (!page) page = 1;

                let formattedSavedQueues;
                queues = await usersDb.get(`${interaction.member.id}.savedQueues`);
                
                let savedQueuesParsed = queues?.slice(process.env.SAVED_QUEUES_PER_PAGE * (page - 1), process.env.SAVED_QUEUES_PER_PAGE * page)

                savedQueuesParsed?.forEach((item, i) => savedQueuesParsed[i] = `**#${getTrackIndex(item, interaction) + 1}** | Name: *${item.name}* • Songs: ${item.queue.length}`);
                formattedSavedQueues = savedQueuesParsed?.join('\n') ? savedQueuesParsed?.join('\n') : `You don't have any queues saved yet!`;
                if (!queues?.length) queues = { length: 0 };
                
                row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('savedQueuesPrevPage')
                            .setLabel(`Previous Page${ (page - 1) ? ` (Page ${page - 1})` : `` }`)
                            .setStyle('PRIMARY'),
                        new MessageButton()
                            .setCustomId('savedQueuesNextPage')
                            .setLabel(`Next Page (Page ${page + 1})`)
                            .setStyle('PRIMARY'),
                    );

                if (page <= 1) row.components[0].setDisabled(true);
                if (Math.ceil(queues?.length / process.env.SAVED_QUEUES_PER_PAGE) <= page) row.components[1].setDisabled(true);

                let btnTimeout = setTimeout(async () => {
                    row.components.forEach(component => component.setDisabled(true));
                    await interaction.editReply({ components: [row] })
                    db.delete(`${interaction.member.id}.savedQueuesBtnTimeout`);
                }, 10000);

                await db.set(`${interaction.member.id}.savedQueuesBtnTimeout`, btnTimeout[Symbol.toPrimitive]());

                embed = new MessageEmbed()
                    .setTitle('<:savedQueues:980835964920422410> Saved Queues')
                    .setColor('#ff5100')
                    .setDescription(`${formattedSavedQueues}`)
                    .setFooter({ text: `Total saved queues: ${queues?.length} | Page: ${page}/${Math.ceil(queues?.length / process.env.SAVED_QUEUES_PER_PAGE) ? Math.ceil(queues?.length / process.env.SAVED_QUEUES_PER_PAGE) : 1} | Queues per page: ${process.env.SAVED_QUEUES_PER_PAGE}` })

                includesComponents = true;
                break

            case "remove":
                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You have to specify the name of the saved queue!`)
                if (!name) return { embeds: [embed] };

                queue = await usersDb.get(`${interaction.member.id}.savedQueues`)?.find(i => i.name === name);
            
                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You don't have a saved queue with this name!`)
                if (!queue) return { embeds: [embed] };

                queues = await usersDb.get(`${interaction.member.id}.savedQueues`);
                let index = await queues.indexOf(queues.find(i => i.name === name));
                let removed = await queues.splice(index, 1)[0];
                await usersDb.set(`${interaction.member.id}.savedQueues`, queues);

                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:success:980498418227114075> Succesfully removed **${removed.name}**.`)
                break

            case "play":
                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You have to specify the name of the saved queue!`)
                if (!name) return { embeds: [embed] };

                queue = await usersDb.get(`${interaction.member.id}.savedQueues`)?.find(i => i.name === name);
            
                embed = new MessageEmbed()
                    .setColor('#ff5100')
                    .setDescription(`<:error:980498447536910446> You don't have a saved queue with this name!`)
                if (!queue) return { embeds: [embed] };

                return await this.play({ interaction, savedQueue: queue });
        }

        if (includesComponents) return { embeds: [embed], components: [row] };
        return { embeds: [embed] };
    }

    async nowPlaying(interaction) {
        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Nothing is playing!`)
        
        if (!interaction.guild?.musicData?.queue.length) return { embeds: [embed] };

        let loop = await db.get(`${interaction.guild.id}.loop`, "Disabled"),
            dontLeave = await db.get(`${interaction.guild.id}.dontLeave`, false)

        if (!loop) loop = "Disabled";
        if (!dontLeave) dontLeave = false;
        
        let player = interaction.client.manager.get(interaction.guild.id);
        let { nowPlaying } = await interaction.guild.musicData;

        embed = new MessageEmbed()
            .setTitle('<a:song:980829956152111124> Current Song')
            .setColor('#ff5100')
            .addFields(
                { name: 'Title', value: nowPlaying.title, inline: true },
                { name: 'Time Played', value: `\`${nowPlaying.duration !== `🔴 Live` ? `${await formatMsToDuration(player.position)}/${await formatMsToDuration(nowPlaying.duration)}` : `🔴 Live`}\``, inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: 'Volume', value: player.volume + '%', inline: true },
                { name: 'Loop', value: loop ? 'Enabled' : 'Disabled', inline: true },
                { name: '24/7 Mode', value: dontLeave ? 'Enabled' : 'Disabled', inline: true },
            )
            .setImage(nowPlaying.thumbnail)

        return { embeds: [embed] };
    }

    async connect({ vc, interaction }) {
        let player = interaction.client.manager.get(interaction.guild.id);
        if (!player) {
            let embed = new MessageEmbed()
                .setColor('#ff5100')
                .setDescription(`<:error:980498447536910446> There's no player for this guild! Create one with /play.`);
            return { embeds: [embed] };
        };

        player.setVoiceChannel(vc.id);
        player.connect();
        player.play();

        let embed = new MessageEmbed()
            .setDescription('<:success:980498418227114075> Succesfully joined the voice channel.')
            .setColor('#ff5100')

        return { embeds: [embed] };
    }

    async disconnect(interaction) {   
        let player = interaction.client.manager.get(interaction.guild.id);
        if (!player) {
            let embed = new MessageEmbed()
                .setColor('#ff5100')
                .setDescription(`<:error:980498447536910446> There's no player for this guild! Create one with /play.`);
            return { embeds: [embed] };
        };
        
        if (player.state === "DISCONNECTED") {
            let embed = new MessageEmbed()
                .setDescription('<:error:980498447536910446> I\'m not in a voice channel!')
                .setColor('#ff5100')

            return { embeds: [embed] };
        }

        player.disconnect();

        let embed = new MessageEmbed()
            .setDescription('<:success:980498418227114075> Succesfully left the voice channel.')
            .setColor('#ff5100')

        return { embeds: [embed] };
    }

    async dontLeave({ interaction }) {
        let dontLeave = await db.get(`${interaction.guild.id}.dontLeave`, false);

        if (dontLeave) await db.set(`${interaction.guild.id}.dontLeave`, false);
        else await db.set(`${interaction.guild.id}.dontLeave`, true);

        dontLeave = await db.get(`${interaction.guild.id}.dontLeave`, false);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> 24/7 mode has been **${dontLeave ? 'enabled' : 'disabled'}**.`)
        return { embeds: [embed] };
    }

    async loop({ interaction, type }) {
        let loop = await db.get(`${interaction.guild.id}.loop`, "Disabled");
        if (!loop) loop = "Disabled";

        loop = titleCase(loop);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:info:980827075038547998> Loop is set to **${loop}**.`)
        if (!type) return { embeds: [embed] };

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:error:980498447536910446> Loop is already set to **${loop}**!`)
        if (loop === type) return { embeds: [embed] };

        await db.set(`${interaction.guild.id}.loop`, type)
        loop = await db.get(`${interaction.guild.id}.loop`);

        embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> Loop has been set to **${loop}**.`)
        return { embeds: [embed] };
    }

    async announceSongs({ interaction }) {
        let announceSongs = await db.get(`${interaction.guild.id}.announceSongs`);
        if (!announceSongs) announceSongs = true;

        if (announceSongs) await db.set(`${interaction.guild.id}.announceSongs`, false);
        else await db.set(`${interaction.guild.id}.announceSongs`, true);

        announceSongs = db.get(`${interaction.guild.id}.announceSongs`);

        let embed = new MessageEmbed()
            .setColor('#ff5100')
            .setDescription(`<:success:980498418227114075> Song announcing has been **${announceSongs ? 'enabled' : 'disabled'}**.`)
        return { embeds: [embed] };
    }
}

module.exports = new Music();
