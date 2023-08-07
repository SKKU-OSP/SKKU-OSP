import '../User.css';
import Activity from './Frame/Activity';
import Interest from './Frame/Interest';
import OwnerInfo from './Frame/OwnerInfo';

function ProfileActivity(props) {
  const Tab = props.Tab;
  return <>{Tab === '관심분야' ? <Interest /> : Tab === '활동' ? <Activity /> : <OwnerInfo />}</>;
}
export default ProfileActivity;
