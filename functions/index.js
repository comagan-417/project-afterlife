const admin = require('firebase-admin')
admin.initializeApp()

const { analyzeProject } = require('./src/ai/extractor')
const { matchProjectsForMentor, matchMentorsForProject } = require('./src/ai/matcher')
const { onConnectionAccepted } = require('./src/auth/roleManagement')
const { triggerNotification } = require('./src/notifications/notificationService')

module.exports = {
  analyzeProject,
  matchProjectsForMentor,
  matchMentorsForProject,
  onConnectionAccepted,
  triggerNotification,
}
