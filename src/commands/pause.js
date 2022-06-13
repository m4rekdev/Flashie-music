const Music = require('../handlers/Music');

module.exports = {
    name: 'pause',
    description: 'Pauses/unpauses the playback.',
    category: 'music',
    async execute (interaction) {
        await interaction.deferReply();
        
        let options = { interaction };
        let msg = await Music.pause(options);

        await interaction.editReply(msg);
    }
}
