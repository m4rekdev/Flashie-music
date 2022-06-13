const Music = require("../handlers/Music");

module.exports = {
    name: 'volume',
    description: 'Change the playback volume.',
    category: 'music',
    options: [{
        type: 'integer',
        name: 'volume',
        description: 'The volume to set.',
        required: false,
    }],
    async execute(interaction) {
        await interaction.deferReply();

        let volume = await interaction?.options?.getInteger('volume');

        let options = { interaction };
        if (volume) options.volume = volume;

        let msg = await Music.volume(options)
        await interaction.editReply(msg);
    }
}
