import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApplyTeamModal from '../ApplyTeamModal';

export default function TeamArticle(props) {
  const { article } = props;
  const navigate = useNavigate();
  const { board_name } = useParams();

  const onArticle = () => {
    navigate(`/community/article/${article.id}/`)
  };

  const onTeamBoard = () => {
    navigate(`/community/board/${article.name}/${article.id}/`)
  };

  const onWriter = () => {
    navigate(`/user/${article.writer.user.username}`)
  };

  useEffect(() => {
  });

  return (
    <>
      {board_name === "팀 모집" && (
        <div className="board-article">
          <h6>{ !article.anonymous_writer ?
          <span className='board-article-writer' onClick={onWriter}>{article.writer.user.username}</span> :
          <span>익명</span>
          } · 
          </h6>
          <h4 className='board-article-title' onClick={onArticle}>[{article.name}]{article.title}</h4>
          <div>
            <h6 className='inline'>#hashtag</h6>
            <div className='board-article-meta-list'>{ article.board.period_end > new Date() ?
          <span>모집중</span> :
          <span>모집 마감</span>
          }</div>
          </div>
        </div>
      )}
      {board_name === "전체 팀 목록" && (
        <div className="board-article">
          <div>
            <h4 className='board-article-title2'>{article.name}</h4>
            <div className='board-article-modal'><ApplyTeamModal /></div>
          </div>
          <div>
            <h6 className='inline'>{article.description}</h6>
            <div className='board-article-meta-list'>익명 외 몇 명</div>
          </div>
        </div>
      )}
      {board_name === "내 팀 목록" && (
        <div className="board-article">
          <div>
            <h4 className='board-article-title' onClick={onTeamBoard}>{article.name}</h4>
          </div>
          <div>
            <h6 className='inline'>{article.description}</h6>
            <div className='board-article-meta-list'>익명 외 몇 명</div>
          </div>
        </div>
      )}
    </>
  );
}
