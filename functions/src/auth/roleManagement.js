const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createNotification } = require('../notifications/notificationService');

const onConnectionAccepted = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { connectionId } = data;
  if (!connectionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Connection ID is required.');
  }

  const db = admin.firestore();

  try {
    const connectionRef = db.collection('connections').doc(connectionId);
    const connectionSnap = await connectionRef.get();
    
    if (!connectionSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Connection request not found.');
    }

    const connectionData = connectionSnap.data();
    
    if (connectionData.studentId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the intended student can accept this connection.');
    }

    if (connectionData.status === 'accepted') {
       throw new functions.https.HttpsError('failed-precondition', 'Connection is already accepted.');
    }

    // Update connection status
    await connectionRef.update({
      status: 'accepted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create Mentorship record
    const mentorshipRef = db.collection('mentorships').doc();
    await mentorshipRef.set({
      mentorId: connectionData.mentorId,
      studentId: connectionData.studentId,
      projectId: connectionData.projectId,
      supportType: connectionData.supportType || 'General',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    // Create lifecycle event
    const lifecycleRef = db.collection('projectLifecycle').doc();
    await lifecycleRef.set({
      projectId: connectionData.projectId,
      event: 'Connection',
      description: 'Mentorship connection established.',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update project
    const projectRef = db.collection('projects').doc(connectionData.projectId);
    await projectRef.update({
      lifecycle_stage: 'Mentorship'
    });

    // Create notifications
    await createNotification(
      admin, 
      connectionData.mentorId, 
      'mentorship_started', 
      'Mentorship Started!', 
      'A student has accepted your connection request.', 
      { projectId: connectionData.projectId }
    );
    
    await createNotification(
      admin, 
      connectionData.studentId, 
      'mentorship_started', 
      'Mentorship Started!', 
      'You have successfully connected with a mentor.', 
      { projectId: connectionData.projectId }
    );

    return { success: true };

  } catch (error) {
    console.error('Error accepting connection:', error);
    if (error instanceof functions.https.HttpsError) {
       throw error;
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while accepting the connection.');
  }
});

module.exports = { onConnectionAccepted };
