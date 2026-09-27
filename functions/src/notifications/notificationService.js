const functions = require('firebase-functions');
const admin = require('firebase-admin');

async function createNotification(adminInstance, userId, type, title, message, data = {}) {
  const db = adminInstance.firestore();
  const notificationRef = db.collection('notifications').doc();
  const payload = {
    userId,
    type,
    title,
    message,
    data,
    read: false,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  };
  await notificationRef.set(payload);
  return notificationRef.id;
}

const triggerNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }
  
  const { userId, type, title, message, notificationData } = data;
  if (!userId || !type || !title || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }

  try {
    const notificationId = await createNotification(admin, userId, type, title, message, notificationData || {});
    return { success: true, notificationId };
  } catch (error) {
    console.error('Error triggering notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to trigger notification.');
  }
});

module.exports = { triggerNotification, createNotification };
