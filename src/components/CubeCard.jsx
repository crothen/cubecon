export default function CubeCard({ cube, isSelected, voteRank, onVote, isVoting }) {
  const handleClick = () => {
    if (isVoting && onVote) {
      onVote(cube);
    }
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
  };

  const cubeName = cube.name || cube.title || 'Unnamed Cube';
  const listUrl = cube.listUrl || cube.cubeCobraUrl;
  const descUrl = cube.descriptionUrl;

  return (
    <div className="cube-card-wrapper">
      {voteRank && <span className="vote-badge">#{voteRank}</span>}
      
      <div
        className={`cube-card ${isSelected ? 'selected' : ''} ${!isVoting ? 'not-voting' : ''}`}
        onClick={handleClick}
        style={{ cursor: isVoting ? 'pointer' : 'default' }}
      >
        {cube.imageUrl ? (
          <img src={cube.imageUrl} alt={cubeName} className="cube-image" />
        ) : (
          <div className="cube-image placeholder">🎲</div>
        )}
        
        <div className="cube-content">
          <h3>{cubeName}</h3>
          
          {cube.description && (
            <p className="description">{cube.description}</p>
          )}
          
          <div className="cube-links">
            {listUrl && (
              <a
                href={listUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cube-link"
                onClick={handleLinkClick}
              >
                📋 Card List
              </a>
            )}
            {descUrl && (
              <a
                href={descUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cube-link"
                onClick={handleLinkClick}
              >
                📖 About
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
