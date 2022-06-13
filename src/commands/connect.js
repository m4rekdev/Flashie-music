const Music = require('../handlers/Music');

module.exports = {
    name: 'connect',
    description: 'Connects to the specified voice channel.',
    category: 'music',
    options: [{
        type: 'channel',
        name: 'voice_channel',
        description: 'The voice channel to play the song.',
        required: true,
    }],
    async execute(interaction) {
        await interaction.deferReply();

        let vc = await interaction.options?.getChannel('voice_channel');

        let options = { vc, interaction }

        let msg = await Music.connect(options);
        await interaction.editReply(msg);
    }
}