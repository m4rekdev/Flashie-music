const Music = require("../handlers/Music");

module.exports = {
    name: 'back',
    description: 'Goes back by one song or more of songs.',
    category: 'music',
    options: [{
        type: 'integer',
        name: 'songs',
        description: 'How many songs to go back by.',
    }],
    async execute (interaction) {
        await interaction.deferReply();
        
        let songsToGoBackBy = await interaction?.options?.getInteger('songs');
        if (!songsToGoBackBy) songsToGoBackBy = 1;

        let msg = await Music.back({ interaction, songsToGoBackBy });
        await interaction.editReply(msg);
    }
}
