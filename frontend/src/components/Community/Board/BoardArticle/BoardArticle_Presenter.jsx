import { useState } from 'react';
import '../Board.css';
import { BsHandThumbsUp, BsChatLeftText, BsBookmark, BsEye } from 'react-icons/bs';
import ProfileDropdown_Container from '../../ProfileDropdown';

export default function BoardArticle_Presenter(props) {
  const { article, pubDate, onArticle } = props;

  return (
    <div className="board-article">
      {article.title ? (
        <>
          <div className="board-article-header">
            <div className="board-article-main">
              <h4 className="board-article-title" onClick={onArticle}>
                {article.title}
              </h4>
              <div className="board-article-tags">
                {article.tags && article.tags.length > 0 ? (
                  <>
                    {article.tags.map((tag) => (
                      <h6 className="inline board-article-tag" key={tag.name}>
                        #{tag.name.replace(' ', '_')}&nbsp;
                      </h6>
                    ))}
                  </>
                ) : null}
              </div>
            </div>
            <div className="board-article-info">
              <div className="board-article-writer">
                {article.writer ? (
                  article.anonymous_writer ? (
                    <span>익명</span>
                  ) : (
                    <ProfileDropdown_Container
                      userName={article.writer.user.username}
                      userId={article.writer.user.id}
                    />
                  )
                ) : (
                  <span>탈퇴한 이용자</span>
                )}
              </div>
              <div style={{ flexBasis: '55%' }}>
                <div className="board-article-pubdate">{pubDate}</div>
                <div className="board-article-meta-list">
                  <BsHandThumbsUp size={12} className="board-article-meta" /> {article.like_cnt}
                  <BsChatLeftText size={12} className="board-article-meta" /> {article.comment_cnt}
                  <BsBookmark size={12} className="board-article-meta" /> {article.scrap_cnt}
                  <BsEye size={12} className="board-article-meta" /> {article.view_cnt}
                </div>
              </div>
            </div>
          </div>

          <div className="float-clear"></div>
        </>
      ) : (
        <h5>작성된 글이 없습니다.</h5>
      )}
    </div>
  );
}
