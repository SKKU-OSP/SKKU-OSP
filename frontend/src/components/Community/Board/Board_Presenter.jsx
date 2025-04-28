import '../Community.css';
import CommunityNavItem from './CommunityNavItem/index';
import BoardArticle from './BoardArticle/index';
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import { BsPencilFill } from 'react-icons/bs';

export default function Board_Presenter(props) {
  const { isLoadedArticles, articles, onWrite, tabName, maxPageNumber, nowPage, onPageChange, userName } = props;
  const username = userName;

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <ul className="nav nav-fill">
          <CommunityNavItem navName="홍보" tabName={tabName} urlTabName="홍보" />
          <CommunityNavItem navName="정보" tabName={tabName} urlTabName="정보" />
          <CommunityNavItem navName="Q&A" tabName={tabName} urlTabName="질문" />
          <CommunityNavItem navName="자유" tabName={tabName} urlTabName="자유" />
        </ul>
        {username === 'admin' ? (
          <button type="button" className="btn-write" onClick={onWrite}>
            <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
            작성하기
          </button>
        ) : tabName !== '홍보' ? (
          <button type="button" className="btn-write" onClick={onWrite}>
            <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
            작성하기
          </button>
        ) : (
          <button type="button" className="btn-write hidden" onClick={onWrite}>
            <BsPencilFill style={{ marginRight: '7px', marginBottom: '5px' }} />
            작성하기
          </button>
        )}
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
