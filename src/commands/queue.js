const Music = require("../handlers/Music");

module.exports = {
    name: 'queue',
    description: 'Displays the song queue.',
    category: 'music',
    async execute (interaction) {
        await interaction.deferReply();

        let msg = await Music.queue({ interaction });
        await interaction.editReply(msg);
    }
}