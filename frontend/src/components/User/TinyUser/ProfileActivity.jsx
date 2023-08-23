import '../User.css';
import Activity from './Frame/Activity';
import Interest from './Frame/Interest';
import OwnerInfo from './Frame/OwnerInfo';

function ProfileActivity(props) {
  const Tab = props.Tab;
  const githubId = props.githubId;
  return <>{Tab === '관심분야' ? <Interest /> : Tab === '활동' ? <Activity githubId={githubId} /> : <OwnerInfo />}</>;
}
export default ProfileActivity;
