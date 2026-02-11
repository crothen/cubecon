export default function IntroPanel({ onRejoin, hasSession }) {
  return (
    <section className="intro-panel" id="intro-panel">
      <h2>Welcome to CubeCon 2026!</h2>
      <p>
        Join us for an epic day of cube drafting at{' '}
        <strong>Kulturwerk 118, Sursee</strong> on <strong>May 2nd, 2026</strong>.
      </p>
      <p>
        Up to <strong>64 players</strong> will be divided into{' '}
        <strong>8 pods</strong> based on your cube preferences.
      </p>
      <p>Got an invite link? Use it to vote for your favorite cubes!</p>
      
      {hasSession && (
        <div id="rejoin-section">
          <p style={{ color: '#666', marginBottom: '0.75rem' }}>
            Welcome back! You have an active voting session.
          </p>
          <button onClick={onRejoin} className="rejoin-btn">
            Continue Voting →
          </button>
        </div>
      )}
    </section>
  );
}
