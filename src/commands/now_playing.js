const Music = require("../handlers/Music");

module.exports = {
    name: 'now_playing',
    description: 'Shows information about the current song.',
    category: 'music',
    async execute(interaction) {
        await interaction.deferReply();

        let msg = await Music.nowPlaying(interaction);
        await interaction.editReply(msg);
    }
}
