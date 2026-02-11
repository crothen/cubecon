import { useState, useEffect, useCallback } from 'react';
import useInvite from './useInvite';

const MAX_VOTES = 5;
const MIN_VOTES = 3;

export default function useVoting() {
  const {
    inviteCode,
    invite,
    isLoading: isInviteLoading,
    error: inviteError,
    isValid,
    isRegistered,
    isSubmitted,
    savedName,
    savedVotes,
    registerName,
    saveVotes,
  } = useInvite();

  const [votes, setVotes] = useState(Array(MAX_VOTES).fill(null));
  const [voterName, setVoterName] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Initialize state from invite data
  useEffect(() => {
    if (!isInviteLoading && isValid) {
      if (isRegistered) {
        setVoterName(savedName);
        
        // Restore saved votes if any
        if (savedVotes.length > 0) {
          const restoredVotes = Array(MAX_VOTES).fill(null);
          savedVotes.forEach((vote, index) => {
            restoredVotes[index] = {
              id: vote.cubeId,
              name: vote.cubeName,
            };
          });
          setVotes(restoredVotes);
        }
      } else {
        // New invite - show registration modal
        setShowModal(true);
      }
    }
  }, [isInviteLoading, isValid, isRegistered, savedName, savedVotes]);

  const startVoting = async () => {
    if (!voterName.trim()) return;

    const success = await registerName(voterName);
    if (success) {
      setShowModal(false);
      setIsVoting(true);
    }
  };

  const rejoinVoting = () => {
    setIsVoting(true);
  };

  const toggleVote = useCallback((cube) => {
    const cubeData = {
      id: cube.id,
      name: cube.name || cube.cubeName || 'Unknown Cube',
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
  }, []);

  const clearVote = useCallback((rank) => {
    setVotes((currentVotes) => {
      const newVotes = [...currentVotes];
      newVotes.splice(rank - 1, 1);
      newVotes.push(null);
      return newVotes;
    });
  }, []);

  const submitVotes = async () => {
    const validVotes = votes.filter((v) => v !== null);

    if (validVotes.length < MIN_VOTES) {
      alert(`Please select at least ${MIN_VOTES} cubes.`);
      return;
    }

    const success = await saveVotes(votes, voterName);
    if (success) {
      alert('Votes submitted! Thank you for participating.');
      setIsVoting(false);
    } else {
      alert('Error submitting votes. Please try again.');
    }
  };

  const validVoteCount = votes.filter((v) => v !== null).length;
  const canSubmit = validVoteCount >= MIN_VOTES && !isSubmitted;

  return {
    // Invite state
    inviteCode,
    isInviteLoading,
    inviteError,
    isValidInvite: isValid,
    isSubmitted,
    
    // Voting state
    votes,
    voterName,
    setVoterName,
    isVoting,
    showModal,
    hasSession: isRegistered && !isSubmitted,
    canSubmit,
    
    // Actions
    startVoting,
    rejoinVoting,
    toggleVote,
    clearVote,
    submitVotes,
    closeModal: () => setShowModal(false),
  };
}
