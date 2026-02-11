export default function Modal({ isOpen, onSubmit, voterName, setVoterName }) {
  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && voterName.trim()) {
      onSubmit();
    }
  };

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
          onKeyDown={handleKeyDown}
          autoFocus
        />
        
        <button onClick={onSubmit} disabled={!voterName.trim()}>
          START VOTING
        </button>
      </div>
    </div>
  );
}
