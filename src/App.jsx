import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import './index.css';

function MarqueeBanner() {
  const text = "★ CubeCon 2026 ★ May 2nd ★ Kulturwerk 118 ★ Sursee ★ 64 Players ★ 8 Cubes ★";
  return (
    <div className="marquee-banner">
      <div className="marquee-content">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="marquee-text">{text}</span>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header>
      <div className="header-content">
        <img src="/logo.png" alt="CubeCon Logo" className="logo" />
        <h1 className="hero-title">CubeCon</h1>
        <p className="subtitle">02.05.2026 · Kulturwerk 118, Sursee</p>
      </div>
    </header>
  );
}

function IntroPanel({ onRejoin, hasSession }) {
  return (
    <section className="intro-panel" id="intro-panel">
      <h2>Welcome to CubeCon 2026!</h2>
      <p>Join us for an epic day of cube drafting at <strong>Kulturwerk 118, Sursee</strong> on <strong>May 2nd, 2026</strong>.</p>
      <p>Up to <strong>64 players</strong> will be divided into <strong>8 pods</strong> based on your cube preferences.</p>
      <p>Got an invite link? Use it to vote for your favorite cubes!</p>
      {hasSession && (
        <div id="rejoin-section">
          <p style={{ color: '#666', marginBottom: '0.75rem' }}>Welcome back! You have an active voting session.</p>
          <button onClick={onRejoin} className="rejoin-btn">Continue Voting →</button>
        </div>
      )}
    </section>
  );
}

function VotingPanel({ votes, onClearVote, onSubmit, voterName, canSubmit }) {
  return (
    <section className="voting-panel" id="voting-panel">
      <div className="voting-header">
        <h2>🗳️ Your Votes</h2>
        <p>Select your top 3-5 cubes!</p>
      </div>
      <div className="vote-slots">
        {[1, 2, 3, 4, 5].map((rank) => {
          const vote = votes[rank - 1];
          const isOptional = rank > 3;
          const isFilled = !!vote;
          return (
            <div 
              key={rank} 
              className={`vote-slot ${isOptional ? 'optional' : ''} ${isFilled ? 'filled' : ''}`}
              data-rank={rank}
            >
              <span className="rank">#{rank}</span>
              <span className="cube-name">
                {vote?.name || (isOptional ? 'Optional' : 'Click a cube to vote')}
              </span>
              <button 
                className="clear-vote" 
                onClick={() => onClearVote(rank)}
              >×</button>
            </div>
          );
        })}
      </div>
      <button 
        className="submit-votes" 
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        SUBMIT VOTES
      </button>
      <p className="voter-name">Voting as: <strong>{voterName}</strong></p>
    </section>
  );
}

function CubeCard({ cube, isSelected, voteRank, onVote, isVoted }) {
  return (
    <div className="cube-card-wrapper">
      {voteRank && <span className="vote-badge">#{voteRank}</span>}
      <div 
        className={`cube-card ${isSelected ? 'selected' : ''} ${isVoted ? 'voted' : ''}`}
        onClick={() => !isVoted && onVote(cube)}
      >
        {cube.imageUrl ? (
          <img src={cube.imageUrl} alt={cube.name} className="cube-image" />
        ) : (
          <div className="cube-image placeholder">🎲</div>
        )}
        <div className="cube-content">
          <h3>{cube.name}</h3>
          {cube.description && <p className="description">{cube.description}</p>}
          <div className="cube-links">
            {cube.cubeCobraUrl && (
              <a 
                href={cube.cubeCobraUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cube-link"
                onClick={(e) => e.stopPropagation()}
              >
                Cube Cobra
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CubesGrid({ cubes, votes, onVote, isVoting }) {
  if (!cubes.length) {
    return (
      <section className="cubes-section">
        <div className="cubes-grid">
          <div className="loading">Loading cubes...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="cubes-section">
      {isVoting && <h2>Choose Your Cubes</h2>}
      <div className="cubes-grid">
        {cubes.map((cube) => {
          const voteIndex = votes.findIndex(v => v?.id === cube.id);
          const voteRank = voteIndex >= 0 ? voteIndex + 1 : null;
          return (
            <CubeCard
              key={cube.id}
              cube={cube}
              isSelected={voteRank !== null}
              voteRank={voteRank}
              onVote={onVote}
              isVoted={false}
            />
          );
        })}
      </div>
    </section>
  );
}

function PrizesSection() {
  return (
    <section className="prizes-section">
      <h2>🏆 Tournament Structure & Prizes</h2>
      
      <img src="/prizepool-full.jpg" alt="Prize Pool Cards" />
      
      <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
        <h3>Round 1: Cube Draft</h3>
        <p>Everyone plays one of 8 cubes. The <strong>8 pod winners</strong> advance to the finals.</p>
        
        <h3>Finals: Vintage Cube</h3>
        <p>The 8 winners compete in Vintage Cube for the big prizes:</p>
        <ul>
          <li><strong>1st:</strong> Lion's Eye Diamond</li>
          <li><strong>2nd:</strong> Survival of the Fittest</li>
          <li><strong>3rd/4th:</strong> Force of Will</li>
          <li><strong>5th-8th:</strong> Windswept Heath</li>
        </ul>
        
        <h3>Consolation Round</h3>
        <p>Other players get to draft a second cube! Pod winners receive one of:</p>
        <ul style={{ columns: 2, columnGap: '2rem' }}>
          <li>Goblin Welder</li>
          <li>City of Brass</li>
          <li>Worldly Tutor</li>
          <li>Entomb</li>
          <li>Pernicious Deed</li>
          <li>Birds of Paradise</li>
          <li>Wrath of God</li>
        </ul>
        
        <p className="note">
          Note: If there are significantly fewer than 64 players, the prize pool will be adapted. The structure remains the same.
        </p>
      </div>
    </section>
  );
}

function Modal({ isOpen, onClose, onSubmit, voterName, setVoterName }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>WELCOME!</h2>
        <p>Enter your name to vote for your top 3 cubes.</p>
        <input 
          type="text" 
          placeholder="Your name" 
          maxLength={50}
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && voterName.trim() && onSubmit()}
        />
        <button onClick={onSubmit} disabled={!voterName.trim()}>
          START VOTING
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer>
      <a href="mailto:info@aarebogemagic.ch">Contact</a>
      <span style={{ margin: '0 1rem', color: '#999' }}>|</span>
      <a href="/admin.html">Admin</a>
    </footer>
  );
}

function App() {
  const [cubes, setCubes] = useState([]);
  const [votes, setVotes] = useState([null, null, null, null, null]);
  const [voterName, setVoterName] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [hasSession, setHasSession] = useState(false);

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCode(invite);
      // Check for existing session
      const savedSession = localStorage.getItem(`cubecon_session_${invite}`);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setVoterName(session.name);
        setHasSession(true);
      } else {
        setShowModal(true);
      }
    }
  }, []);

  // Fetch cubes
  useEffect(() => {
    async function fetchCubes() {
      try {
        const snapshot = await getDocs(collection(db, 'cubecon_cubes'));
        const cubesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCubes(cubesData);
      } catch (error) {
        console.error('Error fetching cubes:', error);
      }
    }
    fetchCubes();
  }, []);

  const handleStartVoting = () => {
    if (!voterName.trim()) return;
    localStorage.setItem(`cubecon_session_${inviteCode}`, JSON.stringify({
      name: voterName,
      startedAt: new Date().toISOString()
    }));
    setShowModal(false);
    setIsVoting(true);
  };

  const handleRejoin = () => {
    setIsVoting(true);
  };

  const handleVote = (cube) => {
    if (!isVoting) return;
    
    // Check if already voted
    const existingIndex = votes.findIndex(v => v?.id === cube.id);
    if (existingIndex >= 0) return;
    
    // Find first empty slot
    const emptyIndex = votes.findIndex(v => v === null);
    if (emptyIndex >= 0) {
      const newVotes = [...votes];
      newVotes[emptyIndex] = cube;
      setVotes(newVotes);
    }
  };

  const handleClearVote = (rank) => {
    const newVotes = [...votes];
    newVotes[rank - 1] = null;
    // Shift votes up
    for (let i = rank - 1; i < 4; i++) {
      newVotes[i] = newVotes[i + 1];
    }
    newVotes[4] = null;
    setVotes(newVotes);
  };

  const handleSubmitVotes = async () => {
    const validVotes = votes.filter(v => v !== null);
    if (validVotes.length < 3) return;
    
    try {
      await setDoc(doc(db, 'cubecon_votes', inviteCode), {
        name: voterName,
        votes: validVotes.map((v, i) => ({
          cubeId: v.id,
          cubeName: v.name,
          rank: i + 1
        })),
        submittedAt: new Date().toISOString()
      });
      
      localStorage.removeItem(`cubecon_session_${inviteCode}`);
      alert('Votes submitted! Thank you for participating.');
      setIsVoting(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error submitting votes:', error);
      alert('Error submitting votes. Please try again.');
    }
  };

  const canSubmit = votes.filter(v => v !== null).length >= 3;

  return (
    <>
      <MarqueeBanner />
      <Header />
      <main>
        {!isVoting ? (
          <IntroPanel onRejoin={handleRejoin} hasSession={hasSession} />
        ) : (
          <VotingPanel
            votes={votes}
            onClearVote={handleClearVote}
            onSubmit={handleSubmitVotes}
            voterName={voterName}
            canSubmit={canSubmit}
          />
        )}
        
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleStartVoting}
          voterName={voterName}
          setVoterName={setVoterName}
        />
        
        <CubesGrid
          cubes={cubes}
          votes={votes}
          onVote={handleVote}
          isVoting={isVoting}
        />
        
        <PrizesSection />
      </main>
      <Footer />
    </>
  );
}

export default App;
