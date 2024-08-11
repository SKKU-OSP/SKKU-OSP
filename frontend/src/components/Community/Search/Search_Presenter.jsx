import SearchArticle from './SearchArticle/SearchArticle_Container';

function Search_Presenter(props) {
  const articles = props.articles;
  const keyword = props.keyword;
  const tag = props.tag;

  return (
    <div className="col-9">
      <div className="community-nav d-flex">
        <div className="nav nav-fill">
          {keyword ? (
            <li className="nav-item selected-nav-item">
              <div>'{keyword}' 검색 결과</div>
            </li>
          ) : (
            <li className="nav-item selected-nav-item">
              <div>'#{tag}' 검색 결과</div>
            </li>
          )}
        </div>
      </div>
      {articles && articles.length > 0 ? (
        articles.map((article) => <SearchArticle key={article.id} article={article} />)
      ) : (
        <>검색 결과가 없습니다.</>
      )}
    </div>
  );
}
export default Search_Presenter;
