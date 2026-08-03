import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from './firebase';

const TOURNAMENTS_COLLECTION = 'cubecon_tournaments';

let publishedPromise = null;

// Resolves to the currently published tournament ({ id, ...data }) or null.
// Cached for the lifetime of the page load so both hooks share one query.
export function getPublishedTournament() {
  if (!publishedPromise) {
    publishedPromise = getDocs(
      query(
        collection(db, TOURNAMENTS_COLLECTION),
        where('status', '==', 'published'),
        limit(1)
      )
    )
      .then((snap) =>
        snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
      )
      .catch((err) => {
        console.error('Error loading published tournament:', err);
        publishedPromise = null;
        return null;
      });
  }
  return publishedPromise;
}

export async function getTournament(id) {
  try {
    const snap = await getDoc(doc(db, TOURNAMENTS_COLLECTION, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error('Error loading tournament:', err);
    return null;
  }
}
