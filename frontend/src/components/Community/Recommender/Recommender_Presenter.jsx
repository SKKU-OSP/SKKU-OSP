import './Recommender.css';
import RecommenderBar from './TinyRecommender/RecommenderBar';
import RecommenderMain from './TinyRecommender/RecommenderMain';

function Recommender_Presenter() {
  const user = { is_authenticated: true };
  return (
    <div className="community-main">
      <RecommenderBar />
      {user.is_authenticated ? (
        <RecommenderMain />
      ) : (
        <div class="m-2">
          로그인이 필요한 서비스입니다. <a href="/accounts/login/">바로가기</a>
        </div>
      )}
    </div>
  );
}
export default Recommender_Presenter;
