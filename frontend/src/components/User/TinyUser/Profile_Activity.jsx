import '../User.css';
import Activity from './Frame/Activity';
import Interest from './Frame/Interest';
import Owner_Info from './Frame/Owner_Info';

function Profile_Activity(props) {
  const Tab = props.Tab;
  return <>{Tab === '관심분야' ? <Interest /> : Tab === '활동' ? <Activity /> : <Owner_Info />}</>;
}
export default Profile_Activity;
