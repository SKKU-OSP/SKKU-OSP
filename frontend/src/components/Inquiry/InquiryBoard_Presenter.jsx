import '../Community/Community.css';
import './InquiryBoard.css';
import BoardArticle from '../Community/Board/BoardArticle/index'; // BoardArticle은 재사용
import LoaderIcon from 'react-loader-icon';
import Pagination from 'react-js-pagination';
import { BsPencilFill } from 'react-icons/bs';

export default function InquiryBoard_Presenter(props) {
  const { isLoadedArticles, articles, onWrite, tabName, maxPageNumber, nowPage, onPageChange, userName } = props;
  const username = userName;

  return (
    <div>
      <div className="inquiry-header">
        <p className="inquiry-description">SOSD 사이트 이용에 관한 문의나 건의사항을 남겨주세요.</p>
        <hr className="inquiry-separator" />
      </div>
      <div className="community-nav d-flex" style={{ marginTop: '10px' }}>
        {/* 문의게시판은 단일 게시판이므로 CommunityNavItem 제거 */}
        <h3
          className="board-title"
          style={{ fontFamily: 'nanumfont_Bold', fontSize: '28px'}}
        >
          문의게시판
        </h3>
        <button type="button" className="btn-write" onClick={onWrite}>
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
