import User_Presenter from './User_Presenter';
import './User.css';
function User_Container() {
  return (
    <div className="container my-4">
      <div className="row justify-content-center user-container">
        <User_Presenter />
      </div>
    </div>
  );
}
export default User_Container;
