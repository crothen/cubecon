import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_VOTES = 5;
const MIN_VOTES = 3;

function getSessionKey(inviteCode) {
  return `cubecon_session_${inviteCode}`;
}

export default function useVoting() {
  const [votes, setVotes] = useState(Array(MAX_VOTES).fill(null));
  const [voterName, setVoterName] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [hasSession, setHasSession] = useState(false);

  // Check for invite code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    
    if (invite) {
      setInviteCode(invite);
      
      // Check for existing session
      const savedSession = localStorage.getItem(getSessionKey(invite));
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          setVoterName(session.name);
          setHasSession(true);
        } catch {
          localStorage.removeItem(getSessionKey(invite));
          setShowModal(true);
        }
      } else {
        setShowModal(true);
      }
    }
  }, []);

  const startVoting = () => {
    if (!voterName.trim() || !inviteCode) return;
    
    localStorage.setItem(
      getSessionKey(inviteCode),
      JSON.stringify({
        name: voterName,
        startedAt: new Date().toISOString(),
      })
    );
    
    setShowModal(false);
    setIsVoting(true);
  };

  const rejoinVoting = () => {
    setIsVoting(true);
  };

  const toggleVote = (cube) => {
    // Store cube with explicit name for display
    const cubeData = {
      id: cube.id,
      name: cube.name || cube.cubeName || 'Unknown Cube',
      ...cube,
    };

    setVotes((currentVotes) => {
      const existingIndex = currentVotes.findIndex((v) => v?.id === cube.id);

      // Already selected — remove it
      if (existingIndex >= 0) {
        const newVotes = [...currentVotes];
        newVotes.splice(existingIndex, 1);
        newVotes.push(null);
        return newVotes;
      }

      // Find first empty slot
      const emptyIndex = currentVotes.findIndex((v) => v === null);
      if (emptyIndex >= 0) {
        const newVotes = [...currentVotes];
        newVotes[emptyIndex] = cubeData;
        return newVotes;
      }

      return currentVotes;
    });
  };

  const clearVote = (rank) => {
    setVotes((currentVotes) => {
      const newVotes = [...currentVotes];
      newVotes.splice(rank - 1, 1);
      newVotes.push(null);
      return newVotes;
    });
  };

  const submitVotes = async () => {
    const validVotes = votes.filter((v) => v !== null);
    
    if (validVotes.length < MIN_VOTES || !inviteCode) return;

    try {
      await setDoc(doc(db, 'cubecon_votes', inviteCode), {
        name: voterName,
        votes: validVotes.map((v, i) => ({
          cubeId: v.id,
          cubeName: v.name,
          rank: i + 1,
        })),
        submittedAt: new Date().toISOString(),
      });

      localStorage.removeItem(getSessionKey(inviteCode));
      alert('Votes submitted! Thank you for participating.');
      window.location.href = '/';
    } catch (err) {
      console.error('Error submitting votes:', err);
      alert('Error submitting votes. Please try again.');
    }
  };

  const validVoteCount = votes.filter((v) => v !== null).length;
  const canSubmit = validVoteCount >= MIN_VOTES;

  return {
    votes,
    voterName,
    setVoterName,
    isVoting,
    showModal,
    hasSession,
    canSubmit,
    startVoting,
    rejoinVoting,
    toggleVote,
    clearVote,
    submitVotes,
    closeModal: () => setShowModal(false),
  };
}
