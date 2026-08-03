import { useState } from 'react';

function VoteSlot({
  rank,
  vote,
  filledIndex,
  onClear,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
}) {
  const isOptional = rank > 3;
  const isFilled = !!vote;
  const isDraggable = isFilled;

  const className = [
    'vote-slot',
    isOptional && 'optional',
    isFilled && 'filled',
    isDragging && 'dragging',
    isDropTarget && 'drop-target',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      data-rank={rank}
      draggable={isDraggable}
      onDragStart={isDraggable ? (e) => onDragStart(e, filledIndex) : undefined}
      onDragOver={isFilled ? (e) => onDragOver(e, filledIndex) : undefined}
      onDrop={isFilled ? (e) => onDrop(e, filledIndex) : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {isFilled && <span className="drag-handle" aria-hidden="true">⋮⋮</span>}
      <span className="rank">#{rank}</span>
      <span className="cube-name">
        {vote?.name || (isOptional ? 'Optional' : 'Click a cube to vote')}
      </span>
      {isFilled && (
        <button className="clear-vote" onClick={() => onClear(rank)}>
          ×
        </button>
      )}
    </div>
  );
}

export default function VotingPanel({
  votes,
  onClearVote,
  onReorderVotes,
  voterName,
  setVoterName,
  saveStatus,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(voterName);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

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

  const handleDragStart = (e, filledIndex) => {
    setDragIndex(filledIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(filledIndex));
  };

  const handleDragOver = (e, filledIndex) => {
    if (dragIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropIndex !== filledIndex) setDropIndex(filledIndex);
  };

  const handleDrop = (e, filledIndex) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== filledIndex) {
      onReorderVotes(dragIndex, filledIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  let filledCounter = 0;
  const slots = votes.map((vote, i) => ({
    rank: i + 1,
    vote,
    filledIndex: vote ? filledCounter++ : null,
  }));

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'error'
        ? 'Save failed — will retry'
        : saveStatus === 'saved'
          ? 'All changes saved'
          : 'Autosave on';

  return (
    <section className="voting-panel" id="voting-panel">
      <div className="voting-header">
        <h2>🗳️ Your Votes</h2>
        <p>Select your top 3-5 cubes!</p>
      </div>

      <div className="vote-slots">
        {slots.map(({ vote, rank, filledIndex }) => (
          <VoteSlot
            key={rank}
            rank={rank}
            vote={vote}
            filledIndex={filledIndex}
            onClear={onClearVote}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            isDragging={filledIndex !== null && dragIndex === filledIndex}
            isDropTarget={
              filledIndex !== null &&
              dragIndex !== null &&
              dropIndex === filledIndex &&
              dragIndex !== filledIndex
            }
          />
        ))}
      </div>

      <div className="autosave-note">
        <span className={`save-indicator save-${saveStatus}`}>● {saveLabel}</span>
        <p>
          Your votes save automatically as you pick cubes. Drag a selected cube
          up or down to change its ranking.
        </p>
      </div>

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
