const Music = require("../handlers/Music");

module.exports = {
    name: 'skip',
    description: 'Skips the current or more songs.',
    category: 'music',
    options: [{
        type: 'integer',
        name: 'songs',
        description: 'How many songs to skip.',
        required: false,
    }],
    async execute (interaction) {
        await interaction.deferReply();
        
        let songsToSkip = await interaction?.options?.getInteger('songs');
        if (!songsToSkip) songsToSkip = 1;

        let msg = await Music.skip({ interaction, songsToSkip });
        await interaction.editReply(msg);
    }
}
