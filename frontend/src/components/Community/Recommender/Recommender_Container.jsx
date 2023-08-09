import './Recommender.css';
import Recommender_Presenter from './Recommender_Presenter';
function Recommender_Container() {
  return (
    <div className="container my-4">
      <div className="row community-container">
        <Recommender_Presenter />
      </div>
    </div>
  );
}
export default Recommender_Container;
