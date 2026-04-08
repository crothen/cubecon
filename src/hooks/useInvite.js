import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
        setInvite(inviteData);
      }
    } catch (err) {
      console.error('Error validating invite:', err);
      setError('Error validating invite');
    } finally {
      setIsLoading(false);
    }
  };

  const registerName = async (name) => {
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
  };

  const saveVotes = async (votes, name) => {
    if (!inviteCode) return false;

    try {
      const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
      const validVotes = votes.filter((v) => v !== null);

      const submittedAt = new Date().toISOString();
      const voteData = validVotes.map((v, i) => ({
        cubeId: v.id,
        cubeName: v.name,
        rank: i + 1,
      }));

      await updateDoc(inviteRef, {
        name: name,
        votes: voteData,
        submittedAt: submittedAt,
        status: 'submitted',
      });

      // Sheets sync now handled by Firebase Function (server-side)

      setInvite((prev) => ({
        ...prev,
        status: 'submitted',
        votes: validVotes,
      }));

      return true;
    } catch (err) {
      console.error('Error saving votes:', err);
      return false;
    }
  };

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
