// CubeCon 2026 - Main App
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc,
  setDoc,
  getDoc,
  query,
  orderBy 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDVFgw_hGcDQHf0iCo2adlkDOL6U7VsdaM",
  authDomain: "cubecon-2026.firebaseapp.com",
  projectId: "cubecon-2026",
  storageBucket: "cubecon-2026.firebasestorage.app",
  messagingSenderId: "661185183975",
  appId: "1:661185183975:web:c2daafe316604a349be242"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State
let cubes = [];
let votes = [null, null, null, null, null]; // Top 5 votes (3 required)
let recipientId = null; // Unique invite code
let recipientData = null;
let votingDeadline = null;
let isVotingClosed = false;

// DOM Elements
const cubesGrid = document.getElementById('cubes-grid');
const votingPanel = document.getElementById('voting-panel');
const introPanel = document.getElementById('intro-panel');
const registerModal = document.getElementById('register-modal');
const voterNameInput = document.getElementById('voter-name-input');
const registerBtn = document.getElementById('register-btn');
const submitVotesBtn = document.getElementById('submit-votes');
const voterNameDisplay = document.getElementById('voter-name-display');

// Initialize
async function init() {
  // Load settings (deadline)
  await loadSettings();
  
  // Check URL for invite code
  const params = new URLSearchParams(window.location.search);
  recipientId = params.get('invite');
  
  if (recipientId && recipientId !== 'cubecon2026') {
    // Individual invite link - check if recipient exists
    await loadRecipient();
    
    if (recipientData) {
      // Returning voter - save to localStorage
      localStorage.setItem('cubecon_invite', recipientId);
      votes = recipientData.votes || [null, null, null, null, null];
      showVotingPanel();
    } else {
      // New voter with this invite code
      showRegisterModal();
    }
  } else if (recipientId === 'cubecon2026') {
    // Legacy invite - generate new unique code
    recipientId = generateInviteCode();
    // Update URL without reload
    const newUrl = `${window.location.pathname}?invite=${recipientId}`;
    window.history.replaceState({}, '', newUrl);
    showRegisterModal();
  } else {
    // No invite = landing page - check for stored session
    checkStoredSession();
  }
  
  await loadCubes();
}

// Check for stored voting session
async function checkStoredSession() {
  const storedInvite = localStorage.getItem('cubecon_invite');
  if (!storedInvite) return;
  
  // Verify the session still exists in database
  try {
    const recipientDoc = await getDoc(doc(db, 'cubecon_votes', storedInvite));
    if (recipientDoc.exists()) {
      // Show rejoin option
      const rejoinSection = document.getElementById('rejoin-section');
      const rejoinBtn = document.getElementById('rejoin-btn');
      
      if (rejoinSection && rejoinBtn) {
        rejoinSection.style.display = 'block';
        rejoinBtn.addEventListener('click', () => {
          window.location.href = `?invite=${storedInvite}`;
        });
      }
    } else {
      // Session no longer exists, clear storage
      localStorage.removeItem('cubecon_invite');
    }
  } catch (err) {
    console.error('Error checking stored session:', err);
  }
}

function generateInviteCode() {
  return 'cc26_' + Math.random().toString(36).substr(2, 9);
}

async function loadSettings() {
  try {
    const settingsDoc = await getDoc(doc(db, 'cubecon_settings', 'config'));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      votingDeadline = data.votingDeadline ? new Date(data.votingDeadline) : null;
      isVotingClosed = votingDeadline && new Date() > votingDeadline;
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

async function loadRecipient() {
  try {
    const recipientDoc = await getDoc(doc(db, 'cubecon_votes', recipientId));
    if (recipientDoc.exists()) {
      recipientData = recipientDoc.data();
    }
  } catch (err) {
    console.error('Error loading recipient:', err);
  }
}

function showRegisterModal() {
  registerModal.style.display = 'flex';
}

function showVotingPanel() {
  introPanel.style.display = 'none';
  votingPanel.style.display = 'block';
  document.getElementById('cubes-heading').style.display = 'block';
  voterNameDisplay.textContent = recipientData?.name || 'Guest';
  
  if (isVotingClosed) {
    submitVotesBtn.textContent = 'Voting Closed';
    submitVotesBtn.disabled = true;
  }
  
  updateVoteSlots();
}

// Register voter
registerBtn.addEventListener('click', async () => {
  const name = voterNameInput.value.trim();
  if (!name) return;
  
  recipientData = {
    name: name,
    votes: [null, null, null, null, null],
    createdAt: new Date().toISOString()
  };
  
  try {
    await setDoc(doc(db, 'cubecon_votes', recipientId), recipientData);
    localStorage.setItem('cubecon_invite', recipientId);
    registerModal.style.display = 'none';
    showVotingPanel();
  } catch (err) {
    console.error('Error registering:', err);
    alert('Error registering. Please try again.');
  }
});

voterNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') registerBtn.click();
});

// Load cubes from Firestore
async function loadCubes() {
  try {
    const q = query(collection(db, 'cubecon_cubes'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    cubes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    renderCubes();
  } catch (err) {
    console.error('Error loading cubes:', err);
    cubesGrid.innerHTML = '<div class="empty-state"><h3>Error loading cubes</h3><p>Please try again later.</p></div>';
  }
}

// Render cubes grid
function renderCubes() {
  if (cubes.length === 0) {
    cubesGrid.innerHTML = '<div class="empty-state"><h3>No cubes yet</h3><p>Check back soon!</p></div>';
    return;
  }
  
  cubesGrid.innerHTML = cubes.map(cube => {
    const voteRank = votes.indexOf(cube.id);
    const isSelected = voteRank !== -1;
    
    return `
      <div class="cube-card-wrapper">
        ${isSelected ? `<div class="vote-badge">#${voteRank + 1}</div>` : ''}
        <div class="cube-card ${isSelected ? 'selected' : ''} ${isVotingClosed ? 'voted' : ''}" 
             data-id="${cube.id}" 
             onclick="selectCube('${cube.id}')">
          ${cube.imageUrl 
            ? `<img class="cube-image" src="${cube.imageUrl}" alt="${cube.title}">`
            : `<div class="cube-image placeholder">📦</div>`
          }
          <div class="cube-content">
            <h3>${cube.title}</h3>
            <p class="description">${cube.description || 'No description'}</p>
            <div class="cube-links">
              ${cube.descriptionUrl ? `<a class="cube-link" href="${cube.descriptionUrl}" target="_blank" onclick="event.stopPropagation()">📖 Description</a>` : ''}
              ${cube.listUrl ? `<a class="cube-link" href="${cube.listUrl}" target="_blank" onclick="event.stopPropagation()">📋 List</a>` : ''}
              ${cube.cubecobraUrl && !cube.descriptionUrl && !cube.listUrl ? `<a class="cube-link" href="${cube.cubecobraUrl}" target="_blank" onclick="event.stopPropagation()">View on CubeCobra →</a>` : ''}
            </div>
            ${cube.cardCount ? `
              <div class="cube-meta">
                <span>📦 ${cube.cardCount} cards</span>
                ${cube.category ? `<span>🏷️ ${cube.category}</span>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Select cube for voting
window.selectCube = function(cubeId) {
  if (!recipientId || isVotingClosed) return;
  
  // Check if already voted for this cube
  const existingIndex = votes.indexOf(cubeId);
  if (existingIndex !== -1) {
    // Remove and shift up
    votes.splice(existingIndex, 1);
    votes.push(null);
  } else {
    // Find first empty slot
    const emptySlot = votes.indexOf(null);
    if (emptySlot !== -1) {
      votes[emptySlot] = cubeId;
    } else {
      // All slots full, replace last one
      votes[4] = cubeId;
    }
  }
  
  updateVoteSlots();
  renderCubes();
};

// Update vote slots display
function updateVoteSlots() {
  for (let i = 0; i < 5; i++) {
    const slot = document.querySelector(`.vote-slot[data-rank="${i + 1}"]`);
    const nameSpan = document.getElementById(`vote-${i + 1}`);
    
    if (votes[i]) {
      const cube = cubes.find(c => c.id === votes[i]);
      nameSpan.textContent = cube ? cube.title : 'Unknown cube';
      slot.classList.add('filled');
    } else {
      nameSpan.textContent = i < 3 ? 'Click a cube to vote' : 'Optional';
      slot.classList.remove('filled');
    }
  }
  
  // Enable submit if at least 3 votes filled
  const filledCount = votes.filter(v => v !== null).length;
  submitVotesBtn.disabled = filledCount < 3 || isVotingClosed;
  
  if (isVotingClosed) {
    submitVotesBtn.textContent = 'Voting Closed';
  } else if (recipientData?.submittedAt) {
    submitVotesBtn.textContent = 'Update Votes';
  }
}

// Clear vote slot and promote remaining votes
document.querySelectorAll('.clear-vote').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (isVotingClosed) return;
    const rank = parseInt(e.target.dataset.rank) - 1;
    
    // Remove the vote at this position and shift others up
    votes.splice(rank, 1);
    votes.push(null); // Keep array length at 5
    
    updateVoteSlots();
    renderCubes();
  });
});

// Submit votes
submitVotesBtn.addEventListener('click', async () => {
  if (isVotingClosed || votes.filter(v => v !== null).length < 3) return;
  
  submitVotesBtn.disabled = true;
  submitVotesBtn.textContent = 'Saving...';
  
  try {
    await setDoc(doc(db, 'cubecon_votes', recipientId), {
      ...recipientData,
      votes: votes,
      submittedAt: new Date().toISOString()
    });
    
    recipientData.submittedAt = new Date().toISOString();
    submitVotesBtn.textContent = 'Votes Saved ✓';
    
    setTimeout(() => {
      submitVotesBtn.textContent = 'Update Votes';
      submitVotesBtn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('Error submitting votes:', err);
    submitVotesBtn.textContent = 'Error - Try Again';
    submitVotesBtn.disabled = false;
  }
});

// Start
init();
