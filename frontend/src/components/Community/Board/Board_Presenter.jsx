import '../Community.css';
import CommunityNavItem from './CommunityNavItem/index';
import BoardArticle from './BoardArticle/index';

export default function Board_Presenter(props) {
  const {articles} = props;

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <button className="primary-btn hidden">hidden</button>
        <ul className="nav nav-fill community-nav-items">
          <CommunityNavItem this_board_name="자유" />
          <CommunityNavItem this_board_name="질문" />
          <CommunityNavItem this_board_name="정보" />
          <CommunityNavItem this_board_name="홍보" />
        </ul>
        <button type="button" className="btn btn-primary">
          작성하기
        </button>
      </div>

      {
        articles.map(article => (
          <BoardArticle key={article.id} article={article} />
        ))
      }
    </div>
  );
}
