import './User.css';
import ProfileInfo from './TinyUser/ProfileInfo';
import ProfileTab from './TinyUser/ProfileTab';

function User_Presenter() {
  return (
    <div className="d-flex flex-column col-md-9 col-12 user-container">
      <ProfileInfo />
      <ProfileTab />
    </div>
  );
}
export default User_Presenter;
