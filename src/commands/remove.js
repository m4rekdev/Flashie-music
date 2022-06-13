const Music = require("../handlers/Music");

module.exports = {
    name: 'remove',
    description: 'Removes an item from the queue.',
    category: 'music',
    options: [{
        type: 'integer',
        name: 'index',
        description: 'Index of the item that you want to remove.',
        required: true,
    }],
    async execute (interaction) {
        await interaction.deferReply();
        
        let index = await interaction.options.getInteger('index');

        let options = { interaction, index };
        let msg = await Music.remove(options);

        await interaction.editReply(msg);
    }
}