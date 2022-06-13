const Music = require("../handlers/Music");

module.exports = {
    name: 'loop',
    description: 'Change the loop type.',
    category: 'music',
    options: [{
        type: 'string',
        name: 'type',
        description: 'Select the loop type that you want.',
        choices: [{
            name: 'Disabled',
            value: 'disabled'
        },
        {
            name: 'Queue',
            value: 'queue'
        },
        {
            name: 'Song',
            value: 'song'
        }]
    }],
    async execute (interaction) {
        await interaction.deferReply();

        let type = interaction.options.getString('type');

        let options = { interaction, type }
        let msg = await Music.loop(options);

        await interaction.editReply(msg);
    }
}