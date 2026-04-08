const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

initializeApp();

const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwhDBPKxNhnPrGHGW8xnINo0jx9BIykqf6wWqLjgNZ6sG1rbwiRa8t_sfjMBn_6uFan6g/exec';

// Sync votes to Google Sheets when invite document is updated
exports.syncVoteToSheets = onDocumentWritten('cubecon_invites/{inviteId}', async (event) => {
  const after = event.data?.after?.data();
  
  // Only sync if status is 'submitted' (has votes)
  if (!after || after.status !== 'submitted') {
    return null;
  }

  const inviteId = event.params.inviteId;

  try {
    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'vote',
        inviteCode: inviteId,
        name: after.name || '',
        votes: after.votes || [],
        submittedAt: after.submittedAt || new Date().toISOString(),
      }),
    });
    console.log(`Synced vote for ${inviteId} to Sheets`);
  } catch (err) {
    console.error('Failed to sync to Sheets:', err);
  }

  return null;
});

// Sync cubes to Google Sheets when any cube document changes
exports.syncCubesToSheets = onDocumentWritten('cubecon_cubes/{cubeId}', async (event) => {
  const db = getFirestore();
  
  try {
    const snapshot = await db.collection('cubecon_cubes').get();
    const cubes = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().title || doc.data().name || 'Untitled',
    }));

    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cubes',
        cubes: cubes,
      }),
    });
    console.log('Synced cubes to Sheets');
  } catch (err) {
    console.error('Failed to sync cubes to Sheets:', err);
  }

  return null;
});
