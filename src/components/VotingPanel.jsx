function VoteSlot({ rank, vote, onClear }) {
  const isOptional = rank > 3;
  const isFilled = !!vote;

  return (
    <div
      className={`vote-slot ${isOptional ? 'optional' : ''} ${isFilled ? 'filled' : ''}`}
      data-rank={rank}
    >
      <span className="rank">#{rank}</span>
      <span className="cube-name">
        {vote?.name || (isOptional ? 'Optional' : 'Click a cube to vote')}
      </span>
      <button className="clear-vote" onClick={() => onClear(rank)}>
        ×
      </button>
    </div>
  );
}

import { useState } from 'react';

export default function VotingPanel({ votes, onClearVote, onSubmit, voterName, setVoterName, canSubmit }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(voterName);

  const handleNameEdit = () => {
    setTempName(voterName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      setVoterName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setTempName(voterName);
    setIsEditingName(false);
  };

  return (
    <section className="voting-panel" id="voting-panel">
      <div className="voting-header">
        <h2>🗳️ Your Votes</h2>
        <p>Select your top 3-5 cubes!</p>
      </div>

      <div className="vote-slots">
        {[1, 2, 3, 4, 5].map((rank) => (
          <VoteSlot
            key={rank}
            rank={rank}
            vote={votes[rank - 1]}
            onClear={onClearVote}
          />
        ))}
      </div>

      <button
        className="submit-votes"
        onClick={onSubmit}
        disabled={!canSubmit}
      >
        SUBMIT VOTES
      </button>
      
      <div className="voter-name-section">
        {isEditingName ? (
          <div className="name-edit-row">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="name-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') handleNameCancel();
              }}
            />
            <button onClick={handleNameSave} className="name-btn save">✓</button>
            <button onClick={handleNameCancel} className="name-btn cancel">✕</button>
          </div>
        ) : (
          <p className="voter-name">
            Voting as: <strong>{voterName}</strong>
            <button onClick={handleNameEdit} className="edit-name-btn">✏️</button>
          </p>
        )}
      </div>
    </section>
  );
}
