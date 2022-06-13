const Music = require('../handlers/Music');

module.exports = {
    name: 'play',
    description: 'Plays a song from YouTube.',
    category: 'music',
    options: [{
        type: 'string',
        name: 'song_or_url',
        description: 'The song or the song url to play.',
        required: true,
    },
    {
        type: 'channel',
        name: 'voice_channel',
        description: 'The voice channel to play the song.',
    }],
    async execute(interaction) {
        await interaction.deferReply();

        let song = await interaction.options.getString('song_or_url');
        let vc = await interaction.options?.getChannel('voice_channel');

        let options = { song, interaction }
        if (vc) options.vc = vc;

        let msg = await Music.play(options);
        await interaction.editReply(msg);
    }
}