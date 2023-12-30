import '../Community.css';
import CommunityNavItem from './CommunityNavItem/index';
import BoardArticle from './BoardArticle/index';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import { BsPencilFill } from 'react-icons/bs';

export default function Board_Presenter(props) {
  const { isLoadedArticles, articles, onWrite, tabName, maxPageNumber, nowPage, onPageChange } = props;

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <ul className="nav nav-fill community-nav-items">
          <CommunityNavItem navName="자유" tabName={tabName} />
          <CommunityNavItem navName="질문" tabName={tabName} />
          <CommunityNavItem navName="정보" tabName={tabName} />
          <CommunityNavItem navName="홍보" tabName={tabName} />
        </ul>
        <button type="button" className="btn-write btn-write" onClick={onWrite}>
          <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
          작성하기
        </button>
      </div>

      {isLoadedArticles ? (
        <>
          {articles.length ? (
            articles.map((article) => <BoardArticle key={article.id} article={article} />)
          ) : (
            <BoardArticle article={{}} />
          )}
          <Pagination
            activePage={nowPage}
            itemsCountPerPage={10}
            totalItemsCount={maxPageNumber * 10}
            pageRangeDisplayed={5}
            onChange={onPageChange}
          ></Pagination>
        </>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </div>
  );
}
