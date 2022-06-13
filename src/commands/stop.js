const Music = require("../handlers/Music");

module.exports = {
    name: 'stop',
    description: 'Stops the playback and clears the queue.',
    category: 'music',
    async execute (interaction) {
        await interaction.deferReply();

        let msg = await Music.stop(interaction);
        await interaction.editReply(msg);
    }
}
