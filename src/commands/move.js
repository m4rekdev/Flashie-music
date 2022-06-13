const Music = require("../handlers/Music");

module.exports = {
    name: 'move',
    description: 'Moves an item in the queue.',
    category: 'music',
    options: [{
        type: 'integer',
        name: 'index',
        description: 'Index of the item that you want to move.',
        required: true,
    },
    {
        type: 'integer',
        name: 'to_index',
        description: 'Index to move the item to.',
        required: true,
    }],
    async execute (interaction) {
        await interaction.deferReply();
        
        let index = await interaction.options.getInteger('index');
        let toIndex = await interaction.options.getInteger('to_index');

        let options = { interaction, index, toIndex };
        let msg = await Music.move(options);

        await interaction.editReply(msg);
    }
}