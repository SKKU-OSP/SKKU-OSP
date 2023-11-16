import '../Community.css';
import SearchArticle from './SearchArticle/SearchArticle_Container';
function Search_Presenter(props) {
  const articles = props.articles;
  const keyword = props.keyword;
  const tag = props.tag;
  return (
    <div className="col-9">
      <div className="searchBar">
        {keyword ? (
          <span className="searchTitle">'{keyword}' 검색 결과</span>
        ) : (
          <span className="searchTitle">Tag 검색 결과</span>
        )}
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
