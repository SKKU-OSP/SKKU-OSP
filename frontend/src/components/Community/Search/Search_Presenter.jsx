import '../Community.css';
import SearchArticle from './SearchArticle/SearchArticle_Container';
function Search_Presenter(props) {
  const articles = props.articles;
  const keyword = props.keyword;
  return (
    <div className="col-9">
      <div className="community-bar d-flex">
        <span>'{keyword}' 검색 결과</span>
      </div>
      {articles && articles.length > 0 ? (
        articles.map((article) => <SearchArticle article={article} />)
      ) : (
        <>검색 결과가 없습니다.</>
      )}
    </div>
  );
}
export default Search_Presenter;
