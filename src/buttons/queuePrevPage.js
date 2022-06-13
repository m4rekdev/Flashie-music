const Music = require('../handlers/Music');

module.exports = {
    name: 'queuePrevPage',
    async execute (interaction) {
        let page = parseInt(interaction.component.label.split('(Page ')[1].replace(')', ''));

        let options = { interaction, page }
        let msg = await Music.queue(options);

        await interaction.update(msg);
    }
}