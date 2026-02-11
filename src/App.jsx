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

export default function App() {
  const { cubes, isLoading } = useCubes();
  
  const {
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

  return (
    <>
      <MarqueeBanner />
      <Header />
      
      <main>
        {!isVoting ? (
          <IntroPanel onRejoin={rejoinVoting} hasSession={hasSession} />
        ) : (
          <VotingPanel
            votes={votes}
            onClearVote={clearVote}
            onSubmit={submitVotes}
            voterName={voterName}
            canSubmit={canSubmit}
          />
        )}

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
          isLoading={isLoading}
        />

        <PrizesSection />
      </main>
      
      <Footer />
    </>
  );
}
