const Music = require("../handlers/Music");

module.exports = {
    name: 'exchange',
    description: 'Exchanges two items in the queue.',
    category: 'music',
    options: [{
        type: 'integer',
        name: 'index',
        description: 'Index of the item that you want to exchange.',
        required: true,
    },
    {
        type: 'integer',
        name: 'to_index',
        description: 'Index of the item that you want to exchange with the first item.',
        required: true,
    }],
    async execute (interaction) {
        await interaction.deferReply();
        
        let index = await interaction.options.getInteger('index');
        let toIndex = await interaction.options.getInteger('to_index');

        let options = { interaction, index, toIndex };
        let msg = await Music.exchange(options);

        await interaction.editReply(msg);
    }
}