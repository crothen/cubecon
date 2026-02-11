import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function useCubes() {
  const [cubes, setCubes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCubes() {
      try {
        setIsLoading(true);
        const snapshot = await getDocs(collection(db, 'cubecon_cubes'));
        const cubesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
