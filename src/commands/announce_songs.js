const Music = require("../handlers/Music");

module.exports = {
    name: 'announce_songs',
    description: 'Enable/disable song announcing.',
    category: 'music',
    async execute (interaction) {
        await interaction.deferReply();

        let options = { interaction }
        let msg = await Music.announceSongs(options);

        await interaction.editReply(msg);
    }
}