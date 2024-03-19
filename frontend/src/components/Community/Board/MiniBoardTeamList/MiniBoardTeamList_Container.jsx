import MiniBoardTeamList_Presenter from './MiniBoardTeamList_Presenter';
import { useNavigate } from 'react-router-dom';

export default function MiniBoardTeamList_Container(props) {
  const { team } = props;

  return <MiniBoardTeamList_Presenter team={team} />;
}
