const Music = require("../handlers/Music");

module.exports = {
    name: 'saved_queues',
    description: 'Control your saved queues.',
    category: 'music',
    options: [{
        type: 'string',
        name: 'action',
        description: 'Select the action that you want.',
        choices: [{
            name: 'Save current queue',
            value: 'save'
        },
        {
            name: 'List saved queues',
            value: 'list'
        },
        {
            name: 'Remove a saved queue',
            value: 'remove'
        },
        {
            name: 'Play a saved queue',
            value: 'play'
        }],
        required: true,
    },
    {
        type: 'string',
        name: 'name',
        description: 'Name of the saved queue to perform the action on.',
    }],
    async execute (interaction) {
        await interaction.deferReply();

        let action = await interaction.options.getString('action');
        let name = await interaction.options.getString('name');

        let options = { interaction, action, name }
        let msg = await Music.savedQueues(options);

        await interaction.editReply(msg);
    }
}
