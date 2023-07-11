import '../../../Community.css';
import { BsHandThumbsUp, BsChatLeftDots, BsBookmark } from 'react-icons/bs';

export default function TinyBoardArticle_Presenter(props) {
  const { isRecruit, isRecruitStarted, isRecruitEnded } = props;

  return (
    <div>
      <div className="article-bar">
        <div className="article-bar-head">
          <div className="article-bar-title my-1">
            {/* 팀 모집 게시판인지 확인 */}
            {isRecruit && (
              <span>
                {/* 팀이 존재하는지 확인 */}
                {1 === 1 ? '[team_name]' : '[삭제된 팀]'}&nbsp;
              </span>
            )}
            titletitletitletitletitletitletitletitletitletitletitletitle
          </div>
        </div>

        {!isRecruit ? (
          <div className="article-bar-meta">
            <div className="d-flex">
              <div className="d-flex article-bar-meta-stat">
                <BsHandThumbsUp className="article-bar-meta-icon" /> 0
              </div>
              <div className="d-flex article-bar-meta-stat">
                <BsChatLeftDots className="article-bar-meta-icon" /> 0
              </div>
              <div className="d-flex article-bar-meta-stat">
                <BsBookmark className="article-bar-meta-icon" /> 0
              </div>
            </div>
          </div>
        ) : (
          <div className="article-bar-recruit-status">
            {!isRecruitStarted ? (
              <div className="badge article-bar-tag-recruit article-bar-tag-recruit-end">모집 전</div>
            ) : !isRecruitEnded ? (
              <div className="badge article-bar-tag-recruit article-bar-tag-recruit-ing">모집 중</div>
            ) : (
              <div className="badge article-bar-tag-recruit article-bar-tag-recruit-end">모집 마감</div>
            )}
          </div>
        )}
        <div className="article-bar-after-meta"></div>
      </div>
    </div>
  );
}
