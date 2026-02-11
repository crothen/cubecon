export default function CubeCard({ cube, isSelected, voteRank, onVote }) {
  const handleClick = () => {
    onVote(cube);
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
  };

  const cubeName = cube.name || cube.title || 'Unnamed Cube';

  return (
    <div className="cube-card-wrapper">
      {voteRank && <span className="vote-badge">#{voteRank}</span>}
      
      <div
        className={`cube-card ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
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
            {cube.cubeCobraUrl && (
              <a
                href={cube.cubeCobraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cube-link"
                onClick={handleLinkClick}
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
