const Music = require("../handlers/Music");

module.exports = {
    name: 'shuffle',
    description: 'Shuffles the queue.',
    category: 'music',
    async execute (interaction) {
        await interaction.deferReply();

        let options = { interaction };
        let msg = await Music.shuffle(options);

        await interaction.editReply(msg);
    }
}