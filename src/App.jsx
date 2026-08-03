import {
  MarqueeBanner,
  Header,
  IntroPanel,
  VotingPanel,
  CubesGrid,
  PrizesSection,
  Modal,
  Footer,
} from './components';
import { useCubes, useVoting } from './hooks';
import './index.css';

function InvalidInvite({ error }) {
  return (
    <section className="intro-panel">
      <h2>⚠️ Invalid Invite</h2>
      <p>{error || 'This invite link is not valid.'}</p>
      <p>Please check your link or contact the organizers.</p>
    </section>
  );
}

function SubmittedPanel({ voterName, votes, onEdit }) {
  const validVotes = votes.filter(v => v);
  return (
    <section className="intro-panel">
      <h2>Votes Submitted!</h2>
      <p>Thank you for voting, <strong>{voterName}</strong>!</p>
      <p>Your votes have been recorded:</p>
      <ol style={{ textAlign: 'left', margin: '1rem 0', paddingLeft: '1.5rem' }}>
        {validVotes.map((vote, i) => (
          <li key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{vote.name || vote.cubeName || 'Unknown Cube'}</strong>
          </li>
        ))}
      </ol>
      {validVotes.length === 0 && (
        <p style={{ color: '#888' }}>No votes recorded yet.</p>
      )}
      <button onClick={onEdit} className="rejoin-btn" style={{ marginTop: '1rem' }}>
        Edit Votes
      </button>
    </section>
  );
}

function LoadingPanel() {
  return (
    <section className="intro-panel">
      <h2>Loading...</h2>
      <p>Checking your invite...</p>
    </section>
  );
}

export default function App() {
  const { cubes, isLoading: cubesLoading } = useCubes();

  const {
    inviteCode,
    isInviteLoading,
    inviteError,
    isValidInvite,
    isSubmitted,
    votes,
    voterName,
    setVoterName,
    isVoting,
    showModal,
    hasSession,
    saveStatus,
    startVoting,
    rejoinVoting,
    toggleVote,
    clearVote,
    reorderVotes,
  } = useVoting();

  // Determine which panel to show
  const renderMainPanel = () => {
    // No invite code - show regular intro
    if (!inviteCode) {
      return <IntroPanel onRejoin={() => {}} hasSession={false} />;
    }

    // Loading invite
    if (isInviteLoading) {
      return <LoadingPanel />;
    }

    // Invalid invite
    if (inviteError || !isValidInvite) {
      return <InvalidInvite error={inviteError} />;
    }

    // Active voting session (including editing after submission)
    if (isVoting) {
      return (
        <VotingPanel
          votes={votes}
          onClearVote={clearVote}
          onReorderVotes={reorderVotes}
          voterName={voterName}
          setVoterName={setVoterName}
          saveStatus={saveStatus}
        />
      );
    }

    // Already submitted - show summary with edit option
    if (isSubmitted) {
      return <SubmittedPanel voterName={voterName} votes={votes} onEdit={rejoinVoting} />;
    }

    // Has session but not actively voting (rejoin available)
    return <IntroPanel onRejoin={rejoinVoting} hasSession={hasSession} />;
  };

  return (
    <>
      <MarqueeBanner />
      <Header />

      <main>
        {renderMainPanel()}

        <Modal
          isOpen={showModal}
          onSubmit={startVoting}
          voterName={voterName}
          setVoterName={setVoterName}
        />

        <CubesGrid
          cubes={cubes}
          votes={votes}
          onVote={toggleVote}
          isVoting={isVoting}
          isLoading={cubesLoading}
        />

        <PrizesSection />
      </main>

      <Footer />
    </>
  );
}
