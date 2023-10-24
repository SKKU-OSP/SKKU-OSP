import ProfileInfo from './TinyUser/ProfileInfo';
import ProfileTab from './TinyUser/ProfileTab';
import LoaderIcon from 'react-loader-icon';

function User_Presenter(props) {
  const { userInfo, isEdit } = props;
  return (
    <>
      {userInfo ? (
        <div className="d-flex flex-column col-12 user-container">
          <ProfileInfo userInfo={userInfo} isEdit={isEdit} />
          <ProfileTab github_id={userInfo.github_id} isEdit={isEdit} />
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default User_Presenter;
