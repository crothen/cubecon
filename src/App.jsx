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

function SubmittedPanel({ voterName, votes }) {
  return (
    <section className="intro-panel">
      <h2>✅ Votes Submitted!</h2>
      <p>Thank you for voting, <strong>{voterName}</strong>!</p>
      <p>Your votes have been recorded:</p>
      <ol style={{ textAlign: 'left', maxWidth: '300px', margin: '1rem auto' }}>
        {votes.filter(v => v).map((vote, i) => (
          <li key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{vote.name || vote.cubeName}</strong>
          </li>
        ))}
      </ol>
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
    canSubmit,
    startVoting,
    rejoinVoting,
    toggleVote,
    clearVote,
    submitVotes,
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

    // Already submitted
    if (isSubmitted) {
      return <SubmittedPanel voterName={voterName} votes={votes} />;
    }

    // Active voting session
    if (isVoting) {
      return (
        <VotingPanel
          votes={votes}
          onClearVote={clearVote}
          onSubmit={submitVotes}
          voterName={voterName}
          canSubmit={canSubmit}
        />
      );
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
