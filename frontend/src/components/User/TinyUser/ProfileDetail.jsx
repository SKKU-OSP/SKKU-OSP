import '../User.css';
import Activity from './Frame/Activity';
import Interest from './Frame/Interest';
import OwnerInfo from './Frame/OwnerInfo';

function ProfileDetail(props) {
  const { Tab, githubId, isEdit } = props;
  return (
    <>
      {Tab === '관심분야' ? (
        <Interest isEdit={isEdit} />
      ) : Tab === '활동' ? (
        <Activity githubId={githubId} isEdit={isEdit} />
      ) : (
        <OwnerInfo />
      )}
    </>
  );
}
export default ProfileDetail;
