import './User.css';
import Profile_Info from './TinyUser/Profile_Info';
import Profile_Tab from './TinyUser/Profile_Tab';
import Profile_Activity from './TinyUser/Profile_Activity';

function User_Presenter() {
  return (
    <div className="d-flex flex-column col-md-9 col-12 user-container">
      <Profile_Info />
      <Profile_Tab />
    </div>
  );
}
export default User_Presenter;
