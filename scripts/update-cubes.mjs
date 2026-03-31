import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVFgw_hGcDQHf0iCo2adlkDOL6U7VsdaM",
  authDomain: "cubecon-2026.firebaseapp.com",
  projectId: "cubecon-2026",
  storageBucket: "cubecon-2026.firebasestorage.app",
  messagingSenderId: "661185183975",
  appId: "1:661185183975:web:c2daafe316604a349be242"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newCubes = [
  {
    title: "Ice Age Cube",
    owner: "Jan",
    listUrl: null,
    descriptionUrl: null,
    description: null,
  },
  {
    title: "CUCube (Peasant)",
    owner: "Chris",
    listUrl: "https://cubecobra.com/cube/list/cr_cu_cube",
    descriptionUrl: "https://cubecobra.com/cube/about/cr_cu_cube",
    description: null,
  },
  {
    title: "Vintage Cube",
    owner: "Corsin (proxied)",
    listUrl: null,
    descriptionUrl: null,
    description: "Proxied vintage cube",
  },
  {
    title: "GROTTO GAMES Vintage Cube",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/GGVC",
    descriptionUrl: "https://cubecobra.com/cube/about/GGVC",
    description: null,
  },
  {
    title: "100 Ornithopters (Grid)",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/709333eb-dece-42ed-be5e-e060f2e73453",
    descriptionUrl: "https://cubecobra.com/cube/about/709333eb-dece-42ed-be5e-e060f2e73453",
    description: null,
  },
  {
    title: "Chris' Pauper Cube",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/chrispaupercube",
    descriptionUrl: "https://cubecobra.com/cube/about/chrispaupercube",
    description: null,
  },
  {
    title: "Chris' Spicy Ramen Cube",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/CSRC",
    descriptionUrl: "https://cubecobra.com/cube/about/CSRC",
    description: null,
  },
  {
    title: "Final Fantasy Set Cube",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/ffmtg",
    descriptionUrl: "https://cubecobra.com/cube/about/ffmtg",
    description: null,
  },
  {
    title: "Fata Morgana (Desert Cube)",
    owner: "Daniel Andres (via Léo T.)",
    listUrl: "https://cubecobra.com/cube/list/1d80e361-5f9f-4e11-924a-1e5a64f9811f",
    descriptionUrl: "https://cubecobra.com/cube/about/1d80e361-5f9f-4e11-924a-1e5a64f9811f",
    description: null,
  },
  {
    title: "billythekiddie's LSV Cube",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/101b0af2-3dcd-41d6-8aec-87dcd4a59bc2",
    descriptionUrl: "https://cubecobra.com/cube/about/101b0af2-3dcd-41d6-8aec-87dcd4a59bc2",
    description: null,
  },
  {
    title: "Draft Nostalgia",
    owner: null,
    listUrl: "https://cubecobra.com/cube/list/61f06f6207da445b5a211ffb",
    descriptionUrl: "https://cubecobra.com/cube/about/61f06f6207da445b5a211ffb",
    description: null,
  },
];

async function main() {
  console.log('Deleting existing cubes...');
  const cubesRef = collection(db, 'cubecon_cubes');
  const snapshot = await getDocs(cubesRef);
  
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'cubecon_cubes', docSnap.id));
    console.log(`  Deleted: ${docSnap.data().title || docSnap.id}`);
  }
  console.log(`Deleted ${snapshot.size} cubes.`);

  console.log('\nAdding new cubes...');
  for (let i = 0; i < newCubes.length; i++) {
    const cube = {
      ...newCubes[i],
      order: i,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(cubesRef, cube);
    console.log(`  Added: ${cube.title} (${docRef.id})`);
  }
  console.log(`\nDone! Added ${newCubes.length} cubes.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
