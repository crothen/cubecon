const SHEET_ID = '103B60ks7_0I7lLotaDc5dQckGy8Vxf1H7amFgHkMAFs';

// Add custom menu when spreadsheet opens
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎲 CubeCon')
    .addItem('Generate Pods', 'generatePods')
    .addItem('Sync All Votes (from Firestore)', 'syncAllFromFirestore')
    .addToUi();
}

function doPost(e) {
  // Use lock to prevent concurrent writes
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds
    
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    if (data.type === 'vote') {
      syncVote(ss, data);
      generatePods(); // Auto-regenerate pods
    } else if (data.type === 'cubes') {
      syncCubes(ss, data.cubes);
      generatePods(); // Auto-regenerate pods
    }
  } finally {
    lock.releaseLock();
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function syncVote(ss, data) {
  const sheet = ss.getSheetByName('votes') || ss.insertSheet('votes');
  
  // Ensure headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Invite Code', 'Name', 'Vote 1', 'Vote 2', 'Vote 3', 'Vote 4', 'Vote 5', 'Submitted At']);
  }
  
  const votes = data.votes || [];
  const row = [
    data.inviteCode,
    data.name,
    votes[0]?.cubeId || '',
    votes[1]?.cubeId || '',
    votes[2]?.cubeId || '',
    votes[3]?.cubeId || '',
    votes[4]?.cubeId || '',
    data.submittedAt || new Date().toISOString()
  ];
  
  // Find existing row by invite code
  const dataRange = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === data.inviteCode) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function syncCubes(ss, cubes) {
  const sheet = ss.getSheetByName('cubes') || ss.insertSheet('cubes');
  sheet.clear();
  sheet.appendRow(['Cube ID', 'Cube Name']);
  cubes.forEach(cube => {
    sheet.appendRow([cube.id, cube.name]);
  });
}

// Calculate optimal pod distribution for N players
// Pods must be 6, 7, or 8 players. Prioritize 8, then 7, then 6.
function calculatePodDistribution(n) {
  if (n < 6) return null; // Can't form a pod
  
  // Try to maximize 8-player pods
  for (let pods8 = Math.floor(n / 8); pods8 >= 0; pods8--) {
    const remaining = n - (pods8 * 8);
    if (remaining === 0) return { pods8, pods7: 0, pods6: 0 };
    
    // Try to fill remaining with 7s and 6s
    for (let pods7 = Math.floor(remaining / 7); pods7 >= 0; pods7--) {
      const remaining7 = remaining - (pods7 * 7);
      if (remaining7 >= 0 && remaining7 % 6 === 0) {
        const pods6 = remaining7 / 6;
        return { pods8, pods7, pods6 };
      }
    }
  }
  
  // Fallback: try with fewer constraints
  for (let pods7 = Math.floor(n / 7); pods7 >= 0; pods7--) {
    const remaining = n - (pods7 * 7);
    if (remaining >= 0 && remaining % 6 === 0) {
      return { pods8: 0, pods7, pods6: remaining / 6 };
    }
  }
  
  return null;
}

// Generate pods - runs automatically on vote/cube changes, or manually from menu
function generatePods() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const votesSheet = ss.getSheetByName('votes');
  const cubesSheet = ss.getSheetByName('cubes');
  const podsSheet = ss.getSheetByName('pods') || ss.insertSheet('pods');
  
  if (!votesSheet || votesSheet.getLastRow() < 2) {
    podsSheet.clear();
    podsSheet.appendRow(['Pod (Cube)', 'Player Count', 'Players']);
    podsSheet.appendRow(['No votes yet']);
    return;
  }
  
  // Load data
  const votes = votesSheet.getDataRange().getValues().slice(1);
  const cubesData = cubesSheet ? cubesSheet.getDataRange().getValues().slice(1) : [];
  const cubeNames = {};
  cubesData.forEach(row => { cubeNames[row[0]] = row[1]; });
  
  // Build player preferences
  const players = {};
  votes.forEach(row => {
    const [code, name, v1, v2, v3, v4, v5] = row;
    if (!code) return;
    players[code] = {
      name: name,
      prefs: [v1, v2, v3, v4, v5].filter(v => v)
    };
  });
  
  const playerCount = Object.keys(players).length;
  
  // Calculate pod distribution
  const dist = calculatePodDistribution(playerCount);
  if (!dist) {
    podsSheet.clear();
    podsSheet.appendRow(['Error: Cannot form valid pods with ' + playerCount + ' players']);
    podsSheet.appendRow(['Need at least 6 players, and total must be divisible into groups of 6, 7, or 8']);
    return;
  }
  
  const totalPods = dist.pods8 + dist.pods7 + dist.pods6;
  const podSizes = [];
  for (let i = 0; i < dist.pods8; i++) podSizes.push(8);
  for (let i = 0; i < dist.pods7; i++) podSizes.push(7);
  for (let i = 0; i < dist.pods6; i++) podSizes.push(6);
  
  // Count votes per cube to determine which cubes get pods
  const cubeVoteCounts = {};
  Object.values(players).forEach(p => {
    p.prefs.forEach((cubeId, idx) => {
      if (!cubeVoteCounts[cubeId]) cubeVoteCounts[cubeId] = { total: 0, weighted: 0 };
      cubeVoteCounts[cubeId].total++;
      cubeVoteCounts[cubeId].weighted += (5 - idx); // Higher preference = more weight
    });
  });
  
  // Sort cubes by weighted vote count (most popular first)
  const sortedCubes = Object.entries(cubeVoteCounts)
    .sort((a, b) => b[1].weighted - a[1].weighted)
    .map(e => e[0]);
  
  // Assign pods to top cubes
  const pods = {}; // cubeId -> { maxSize, members: [] }
  for (let i = 0; i < Math.min(totalPods, sortedCubes.length); i++) {
    pods[sortedCubes[i]] = { maxSize: podSizes[i], members: [] };
  }
  
  // If more pod slots than cubes, add extra slots to most popular cubes
  if (totalPods > sortedCubes.length) {
    for (let i = sortedCubes.length; i < totalPods; i++) {
      const cubeId = sortedCubes[i % sortedCubes.length];
      pods[cubeId + '_extra_' + i] = { maxSize: podSizes[i], members: [] };
    }
  }
  
  // Track assignments
  const playerPrefLevel = {};
  const assigned = new Set();
  
  // Pass 1-5: Assign by preference level
  for (let prefLevel = 0; prefLevel < 5; prefLevel++) {
    // Shuffle player order each pass for fairness
    const playerCodes = Object.keys(players).filter(c => !assigned.has(c));
    shuffleArray(playerCodes);
    
    playerCodes.forEach(code => {
      if (assigned.has(code)) return;
      const cubeId = players[code].prefs[prefLevel];
      if (!cubeId || !pods[cubeId]) return;
      
      if (pods[cubeId].members.length < pods[cubeId].maxSize) {
        pods[cubeId].members.push(code);
        playerPrefLevel[code] = prefLevel + 1;
        assigned.add(code);
      }
    });
  }
  
  // Pass 6: Assign remaining players to any pod with space (by their preference order)
  Object.keys(players).forEach(code => {
    if (assigned.has(code)) return;
    
    // Try player's preferences first
    for (const cubeId of players[code].prefs) {
      if (pods[cubeId] && pods[cubeId].members.length < pods[cubeId].maxSize) {
        pods[cubeId].members.push(code);
        playerPrefLevel[code] = 'alt';
        assigned.add(code);
        return;
      }
    }
    
    // Try any pod with space
    for (const [cubeId, pod] of Object.entries(pods)) {
      if (pod.members.length < pod.maxSize) {
        pod.members.push(code);
        playerPrefLevel[code] = '—';
        assigned.add(code);
        return;
      }
    }
  });
  
  // Write pods sheet
  podsSheet.clear();
  podsSheet.appendRow(['Pod (Cube)', 'Size', 'Players']);
  
  // Sort pods by member count descending
  const sortedPods = Object.entries(pods)
    .filter(([_, pod]) => pod.members.length > 0)
    .sort((a, b) => b[1].members.length - a[1].members.length);
  
  sortedPods.forEach(([cubeId, pod]) => {
    const cubeName = cubeNames[cubeId.replace(/_extra_\d+$/, '')] || cubeId;
    const playerList = pod.members.map(code => {
      const name = players[code]?.name || code;
      const pref = playerPrefLevel[code];
      return `${name} (#${pref})`;
    }).join(', ');
    podsSheet.appendRow([cubeName, pod.members.length, playerList]);
  });
  
  // Summary
  const stillUnassigned = Object.keys(players).filter(code => !assigned.has(code));
  
  podsSheet.appendRow(['']);
  podsSheet.appendRow(['--- Summary ---']);
  podsSheet.appendRow(['Total Players', playerCount]);
  podsSheet.appendRow(['Total Pods', sortedPods.length]);
  podsSheet.appendRow(['Target Distribution', `${dist.pods8}×8 + ${dist.pods7}×7 + ${dist.pods6}×6 = ${playerCount}`]);
  podsSheet.appendRow(['Assigned', assigned.size]);
  
  if (stillUnassigned.length > 0) {
    podsSheet.appendRow(['⚠️ UNASSIGNED', stillUnassigned.length, stillUnassigned.map(c => players[c]?.name || c).join(', ')]);
  }
  
  // Preference distribution
  const prefCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, alt: 0, '—': 0 };
  Object.values(playerPrefLevel).forEach(p => {
    if (prefCounts[p] !== undefined) prefCounts[p]++;
  });
  
  podsSheet.appendRow(['']);
  podsSheet.appendRow(['--- Preference Distribution ---']);
  podsSheet.appendRow(['#1 choice', prefCounts[1]]);
  podsSheet.appendRow(['#2 choice', prefCounts[2]]);
  podsSheet.appendRow(['#3 choice', prefCounts[3]]);
  podsSheet.appendRow(['#4 choice', prefCounts[4]]);
  podsSheet.appendRow(['#5 choice', prefCounts[5]]);
  podsSheet.appendRow(['Alternative', prefCounts.alt]);
  podsSheet.appendRow(['Forced', prefCounts['—']]);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Manual sync placeholder - regenerates pods from current sheet data
function syncAllFromFirestore() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Sync & Regenerate',
    'This will regenerate pods from the current votes sheet data.\n\n' +
    'If votes are missing, clear test data in admin and regenerate.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (result === ui.Button.YES) {
    generatePods();
    ui.alert('Done', 'Pods regenerated from current votes data.', ui.ButtonSet.OK);
  }
}
