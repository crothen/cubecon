const SHEET_ID = '103B60ks7_0I7lLotaDc5dQckGy8Vxf1H7amFgHkMAFs';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  if (data.type === 'vote') {
    syncVote(ss, data);
  } else if (data.type === 'cubes') {
    syncCubes(ss, data.cubes);
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

// Run this manually or on trigger to generate pods
function generatePods() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const votesSheet = ss.getSheetByName('votes');
  const cubesSheet = ss.getSheetByName('cubes');
  const podsSheet = ss.getSheetByName('pods') || ss.insertSheet('pods');
  
  if (!votesSheet || votesSheet.getLastRow() < 2) {
    podsSheet.clear();
    podsSheet.appendRow(['No votes yet']);
    return;
  }
  
  // Load data
  const votes = votesSheet.getDataRange().getValues().slice(1); // skip header
  const cubesData = cubesSheet ? cubesSheet.getDataRange().getValues().slice(1) : [];
  const cubeNames = {};
  cubesData.forEach(row => { cubeNames[row[0]] = row[1]; });
  
  // Build player preferences: {inviteCode: {name, prefs: [cubeId, ...]}}
  const players = {};
  votes.forEach(row => {
    const [code, name, v1, v2, v3, v4, v5] = row;
    if (!code) return;
    players[code] = {
      name: name,
      prefs: [v1, v2, v3, v4, v5].filter(v => v)
    };
  });
  
  // Collect all cubes that received votes
  const allCubes = new Set();
  Object.values(players).forEach(p => p.prefs.forEach(c => allCubes.add(c)));
  
  // Greedy allocation: prioritize higher preferences
  const pods = {}; // cubeId -> [playerCodes]
  const assigned = new Set();
  
  // Pass 1-5: Try to assign by preference level
  for (let prefLevel = 0; prefLevel < 5; prefLevel++) {
    Object.entries(players).forEach(([code, player]) => {
      if (assigned.has(code)) return;
      const cubeId = player.prefs[prefLevel];
      if (!cubeId) return;
      
      if (!pods[cubeId]) pods[cubeId] = [];
      
      // Only add if pod not full (max 8)
      if (pods[cubeId].length < 8) {
        pods[cubeId].push(code);
        assigned.add(code);
      }
    });
  }
  
  // Filter out pods with < 6 players, redistribute those players
  const validPods = {};
  const unassigned = [];
  
  Object.entries(pods).forEach(([cubeId, members]) => {
    if (members.length >= 6) {
      validPods[cubeId] = members;
    } else {
      members.forEach(code => unassigned.push(code));
    }
  });
  
  // Try to fit unassigned into existing pods (up to 8)
  unassigned.forEach(code => {
    const player = players[code];
    for (const pref of player.prefs) {
      if (validPods[pref] && validPods[pref].length < 8) {
        validPods[pref].push(code);
        return;
      }
    }
    // If still unassigned, add to any pod with space
    for (const [cubeId, members] of Object.entries(validPods)) {
      if (members.length < 8) {
        members.push(code);
        return;
      }
    }
  });
  
  // Write pods sheet
  podsSheet.clear();
  podsSheet.appendRow(['Pod (Cube)', 'Player Count', 'Players']);
  
  Object.entries(validPods).forEach(([cubeId, members]) => {
    const cubeName = cubeNames[cubeId] || cubeId;
    const playerNames = members.map(code => players[code]?.name || code).join(', ');
    podsSheet.appendRow([cubeName, members.length, playerNames]);
  });
  
  // Summary row
  podsSheet.appendRow([]);
  podsSheet.appendRow(['Total Pods', Object.keys(validPods).length]);
  podsSheet.appendRow(['Total Assigned', Object.values(validPods).flat().length]);
  podsSheet.appendRow(['Total Voters', Object.keys(players).length]);
}
