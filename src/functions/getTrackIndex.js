function getTrackIndex(track, interaction) {
  return interaction.guild.musicData.queue.indexOf(track);
}

module.exports = getTrackIndex;