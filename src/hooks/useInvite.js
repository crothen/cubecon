import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getPublishedTournament, getTournament } from '../tournament';

const INVITES_COLLECTION = 'cubecon_invites';

export default function useInvite() {
  const [inviteCode, setInviteCode] = useState(null);
  const [invite, setInvite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    
    if (code) {
      setInviteCode(code);
      validateInvite(code);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateInvite = async (code) => {
    try {
      setIsLoading(true);
      setError(null);

      const inviteRef = doc(db, INVITES_COLLECTION, code);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        setError('Invalid invite link');
        setInvite(null);
      } else {
        const inviteData = { id: inviteSnap.id, ...inviteSnap.data() };
        const published = await getPublishedTournament();

        if (inviteData.tournamentId && inviteData.tournamentId !== published?.id) {
          // Invite belongs to a tournament that is not live on the site
          const tournament = await getTournament(inviteData.tournamentId);
          if (tournament?.status === 'archived') {
            setError('This tournament has ended — voting is closed.');
          } else {
            setError('Voting is not open for this tournament yet.');
          }
          setInvite(null);
        } else if (!inviteData.tournamentId && !published) {
          // Legacy invite with no tournament while nothing is published
          setError('Voting is currently closed.');
          setInvite(null);
        } else {
          setInvite(inviteData);
        }
      }
    } catch (err) {
      console.error('Error validating invite:', err);
      setError('Error validating invite');
    } finally {
      setIsLoading(false);
    }
  };

  const registerName = useCallback(async (name) => {
    if (!inviteCode || !invite) return false;

    try {
      const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
      await updateDoc(inviteRef, {
        name: name.trim(),
        registeredAt: new Date().toISOString(),
        status: 'registered',
      });

      setInvite((prev) => ({
        ...prev,
        name: name.trim(),
        status: 'registered',
      }));

      return true;
    } catch (err) {
      console.error('Error registering name:', err);
      return false;
    }
  }, [inviteCode, invite]);

  const saveVotes = useCallback(async (votes, name, status = 'submitted') => {
    if (!inviteCode) return false;

    try {
      const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
      const validVotes = votes.filter((v) => v !== null);

      const voteData = validVotes.map((v, i) => ({
        cubeId: v.id,
        cubeName: v.name,
        rank: i + 1,
      }));

      const payload = {
        name: name,
        votes: voteData,
        status: status,
        updatedAt: new Date().toISOString(),
      };
      if (status === 'submitted') {
        payload.submittedAt = new Date().toISOString();
      }

      await updateDoc(inviteRef, payload);

      // Sheets sync now handled by Firebase Function (server-side)

      setInvite((prev) => ({
        ...prev,
        status: status,
        votes: validVotes,
      }));

      return true;
    } catch (err) {
      console.error('Error saving votes:', err);
      return false;
    }
  }, [inviteCode]);

  // Derived states
  const isValid = invite !== null && !error;
  const isRegistered = invite?.status === 'registered' || invite?.status === 'submitted';
  const isSubmitted = invite?.status === 'submitted';
  const savedName = invite?.name || '';
  const savedVotes = invite?.votes || [];

  return {
    inviteCode,
    invite,
    isLoading,
    error,
    isValid,
    isRegistered,
    isSubmitted,
    savedName,
    savedVotes,
    registerName,
    saveVotes,
  };
}
