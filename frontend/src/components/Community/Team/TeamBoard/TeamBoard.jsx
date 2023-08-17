import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import CommunityNavItem from '../../Board/CommunityNavItem/index';

function TeamBoard() {
  const navigate = useNavigate();
  const { team_name } = useParams();

  const onMyTeamList = () => {
    navigate(`/community/board/내 팀 목록/myteam`);
  }

  const onWrite = () => {
    navigate(`/community/board/내 팀 목록/myteam`);
  }

  useEffect(() => {
  });

  return (
    <>
    <div className="col-9">
      <div className="community-team-nav d-flex">
        <Button type="button" onClick={onMyTeamList} id="btn-content-back">
          내 팀 목록
        </Button>
        <ul className="nav nav-fill community-team-nav-items">
          <div>{team_name}</div>
        </ul>
        <Button type="button" onClick={onWrite} className="btn btn-primary">
          작성하기
        </Button>
      </div>
      <div className="team">
        <div className='team-box'>
          <h4 className='team-description'>{team_name}</h4>
          <div>
            <h6 className='inline'>안녕</h6>
          </div>
        </div>
        <div className='team-box'>
          <h4 className='team-members'>{team_name}</h4>
        </div>
      </div>
    </div>
    </>
  );
}

export default TeamBoard;