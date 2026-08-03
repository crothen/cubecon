import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getPublishedTournament } from '../tournament';

export default function useCubes() {
  const [cubes, setCubes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCubes() {
      try {
        setIsLoading(true);

        const tournament = await getPublishedTournament();
        if (!tournament) {
          setCubes([]);
          return;
        }

        const snapshot = await getDocs(
          query(
            collection(db, 'cubecon_cubes'),
            where('tournamentId', '==', tournament.id)
          )
        );
        const cubesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Normalize: ensure 'name' field exists
            name: data.title || data.name || 'Unnamed Cube',
          };
        });
        setCubes(cubesData);
      } catch (err) {
        console.error('Error fetching cubes:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCubes();
  }, []);

  return { cubes, isLoading, error };
}
