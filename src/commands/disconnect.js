const Music = require('../handlers/Music');

module.exports = {
    name: 'disconnect',
    description: 'Disconnects from the current voice channel.',
    category: 'music',
    async execute(interaction) {
        await interaction.deferReply();

        let msg = await Music.disconnect(interaction);
        await interaction.editReply(msg);
    }
}