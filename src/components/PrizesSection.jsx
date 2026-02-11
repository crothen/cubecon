const PRIZES = {
  finals: [
    { place: '1st', prize: "Lion's Eye Diamond" },
    { place: '2nd', prize: 'Survival of the Fittest' },
    { place: '3rd/4th', prize: 'Force of Will' },
    { place: '5th-8th', prize: 'Windswept Heath' },
  ],
  consolation: [
    'Goblin Welder',
    'City of Brass',
    'Worldly Tutor',
    'Entomb',
    'Pernicious Deed',
    'Birds of Paradise',
    'Wrath of God',
  ],
};

export default function PrizesSection() {
  return (
    <section className="prizes-section">
      <h2>🏆 Tournament Structure & Prizes</h2>

      <img src="/prizepool-full.jpg" alt="Prize Pool Cards" />

      <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Round 1: Cube Draft</h3>
        <p>
          Everyone plays one of 8 cubes. The <strong>8 pod winners</strong>{' '}
          advance to the finals.
        </p>

        <h3>Finals: Vintage Cube</h3>
        <p>The 8 winners compete in Vintage Cube for the big prizes:</p>
        <ul>
          {PRIZES.finals.map(({ place, prize }) => (
            <li key={place}>
              <strong>{place}:</strong> {prize}
            </li>
          ))}
        </ul>

        <h3>Consolation Round</h3>
        <p>Other players get to draft a second cube! Pod winners receive one of:</p>
        <ul style={{ columns: 2, columnGap: '2rem' }}>
          {PRIZES.consolation.map((prize) => (
            <li key={prize}>{prize}</li>
          ))}
        </ul>

        <p className="note">
          Note: If there are significantly fewer than 64 players, the prize pool
          will be adapted. The structure remains the same.
        </p>
      </div>
    </section>
  );
}
