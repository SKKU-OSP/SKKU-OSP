import TeamApplication_Presenter from './TeamApplication_Presenter';

export default function TeamApplication_Container({ iconSize, showTeamApp, setShowTeamApp }) {
  return <TeamApplication_Presenter iconSize={iconSize} showTeamApp={showTeamApp} setShowTeamApp={setShowTeamApp} />;
}
