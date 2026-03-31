import CubeCard from './CubeCard';

export default function CubesGrid({ cubes, votes, onVote, isVoting, isLoading }) {
  if (isLoading) {
    return (
      <section className="cubes-section">
        <div className="cubes-grid">
          <div className="loading">Loading cubes...</div>
        </div>
      </section>
    );
  }

  if (!cubes.length) {
    return (
      <section className="cubes-section">
        <div className="cubes-grid">
          <div className="loading">No cubes available yet.</div>
        </div>
      </section>
    );
  }

  const getVoteRank = (cubeId) => {
    const index = votes.findIndex((v) => v?.id === cubeId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <section className="cubes-section">
      {isVoting && <h2>Choose Your Cubes</h2>}
      
      <div className="cubes-grid">
        {cubes.map((cube) => {
          const voteRank = getVoteRank(cube.id);
          return (
            <CubeCard
              key={cube.id}
              cube={cube}
              isSelected={voteRank !== null}
              voteRank={voteRank}
              onVote={onVote}
              isVoting={isVoting}
            />
          );
        })}
      </div>
    </section>
  );
}
