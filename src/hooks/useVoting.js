import { useState, useEffect, useCallback, useRef } from 'react';
import useInvite from './useInvite';

const MAX_VOTES = 5;
const MIN_VOTES = 3;
const AUTOSAVE_DELAY_MS = 400;

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
  const [saveStatus, setSaveStatus] = useState('idle');

  const hasInitializedRef = useRef(false);
  const hasEditedRef = useRef(false);
  const saveTimerRef = useRef(null);

  // Initialize state from invite data
  useEffect(() => {
    if (!isInviteLoading && isValid && !hasInitializedRef.current) {
      if (isRegistered) {
        setVoterName(savedName);

        if (savedVotes.length > 0) {
          const restoredVotes = Array(MAX_VOTES).fill(null);
          savedVotes.forEach((vote, index) => {
            if (index < MAX_VOTES) {
              restoredVotes[index] = {
                id: vote.cubeId || vote.id,
                name: vote.cubeName || vote.name || 'Unknown Cube',
              };
            }
          });
          setVotes(restoredVotes);
        }
        hasInitializedRef.current = true;
      } else {
        setShowModal(true);
        hasInitializedRef.current = true;
      }
    }
  }, [isInviteLoading, isValid, isRegistered, savedName, savedVotes]);

  // Autosave whenever votes change after the user has made an edit
  useEffect(() => {
    if (!isVoting || !hasEditedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      const validVotes = votes.filter((v) => v !== null);
      const nextStatus = validVotes.length >= MIN_VOTES ? 'submitted' : 'registered';
      const success = await saveVotes(votes, voterName, nextStatus);
      setSaveStatus(success ? 'saved' : 'error');
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [votes, voterName, isVoting, saveVotes]);

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
      name: cube.name || cube.title || 'Unknown Cube',
    };

    setVotes((currentVotes) => {
      const existingIndex = currentVotes.findIndex((v) => v?.id === cube.id);

      if (existingIndex >= 0) {
        const newVotes = [...currentVotes];
        newVotes.splice(existingIndex, 1);
        newVotes.push(null);
        hasEditedRef.current = true;
        return newVotes;
      }

      const emptyIndex = currentVotes.findIndex((v) => v === null);
      if (emptyIndex >= 0) {
        const newVotes = [...currentVotes];
        newVotes[emptyIndex] = cubeData;
        hasEditedRef.current = true;
        return newVotes;
      }

      return currentVotes;
    });
  }, []);

  const clearVote = useCallback((rank) => {
    setVotes((currentVotes) => {
      if (!currentVotes[rank - 1]) return currentVotes;
      const newVotes = [...currentVotes];
      newVotes.splice(rank - 1, 1);
      newVotes.push(null);
      hasEditedRef.current = true;
      return newVotes;
    });
  }, []);

  const reorderVotes = useCallback((fromFilledIndex, toFilledIndex) => {
    if (fromFilledIndex === toFilledIndex) return;
    setVotes((currentVotes) => {
      const filled = currentVotes.filter((v) => v !== null);
      if (
        fromFilledIndex < 0 ||
        fromFilledIndex >= filled.length ||
        toFilledIndex < 0 ||
        toFilledIndex >= filled.length
      ) {
        return currentVotes;
      }
      const [moved] = filled.splice(fromFilledIndex, 1);
      filled.splice(toFilledIndex, 0, moved);
      while (filled.length < MAX_VOTES) filled.push(null);
      hasEditedRef.current = true;
      return filled;
    });
  }, []);

  const validVoteCount = votes.filter((v) => v !== null).length;

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
    validVoteCount,
    minVotes: MIN_VOTES,
    saveStatus,

    // Actions
    startVoting,
    rejoinVoting,
    toggleVote,
    clearVote,
    reorderVotes,
    closeModal: () => setShowModal(false),
  };
}
