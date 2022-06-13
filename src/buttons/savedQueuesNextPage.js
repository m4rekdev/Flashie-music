const Music = require('../handlers/Music');

module.exports = {
    name: 'savedQueuesNextPage',
    async execute (interaction) {
        let page = parseInt(interaction.component.label.split('(Page ')[1].replace(')', ''));

        let options = { interaction, action: "list", page }
        let msg = await Music.savedQueues(options);

        await interaction.update(msg);
    }
}