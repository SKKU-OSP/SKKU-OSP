import ProfileInfo from './TinyUser/ProfileInfo';
import ProfileTab from './TinyUser/ProfileTab';
import LoaderIcon from 'react-loader-icon';

function User_Presenter(props) {
  const { userInfo, isEdit, isChange, setIsChange, open_lvl } = props;
  return (
    <>
      {userInfo ? (
        <div className="d-flex flex-column col-12 user-container">
          <ProfileInfo userInfo={userInfo} isEdit={isEdit} isChange={isChange} setIsChange={setIsChange} />
          <ProfileTab github_id={userInfo.github_id} isEdit={isEdit} open_lvl={open_lvl}/>
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default User_Presenter;
