const Music = require("../handlers/Music");

module.exports = {
    name: '24-7',
    description: 'Enable/disable 24/7 mode.',
    category: 'music',
    async execute (interaction) {
        await interaction.deferReply();

        let options = { interaction }
        let msg = await Music.dontLeave(options);

        await interaction.editReply(msg);
    },
}