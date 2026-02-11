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

export default function VotingPanel({ votes, onClearVote, onSubmit, voterName, canSubmit }) {
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
      
      <p className="voter-name">
        Voting as: <strong>{voterName}</strong>
      </p>
    </section>
  );
}
