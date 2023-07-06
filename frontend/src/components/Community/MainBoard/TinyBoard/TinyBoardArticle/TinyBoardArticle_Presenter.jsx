import '../../../Community.css';
import { BsHandThumbsUp, BsChatLeftDots, BsBookmark } from 'react-icons/bs';

export default function TinyBoardArticle_Presenter(props) {
  const { article } = props;

  return (
    <div>
      {/* 팀 모집 게시판인지 확인 */}
      <div className="article-bar" id={1 === 2 && 'article-recruit-bar'}>
        <div className="article-head">
          <div className="article-bar-title my-1">
            {/* 팀 모집 게시판인지 확인 */}
            {1 === 2 && (
              <div>
                {/* 팀이 존재하는지 확인 */}
                {1 === 1 ? '[team_name]' : '[삭제된 팀]'}&nbsp;
              </div>
            )}
            titletitletitletitletitletitletitletitletitletitletitletitle
          </div>
        </div>

        <div className="article-meta">
          <div className="d-flex">
            <div className="d-flex article-meta-stat">
              <BsHandThumbsUp className="article-meta-icon" /> 0
            </div>
            <div className="d-flex article-meta-stat">
              <BsChatLeftDots className="article-meta-icon" /> 0
            </div>
            <div className="d-flex article-meta-stat">
              <BsBookmark className="article-meta-icon" /> 0
            </div>
          </div>
        </div>
        <div className="after-article-meta"></div>
      </div>
    </div>
  );
}
