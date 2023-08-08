import CommunityNavItem_Presenter from './CommunityNavItem_Presenter';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function CommunityNavItem_Container(props) {
  const { this_board_name } = props;
  const { board_name } = useParams();
  const navigate = useNavigate();
  const [isOnBoard, setIsOnBoard] = useState(false);

  const getOnBoard = () => {
    navigate(`/community/${this_board_name}`);
  };

  useEffect(() => {
    if (this_board_name === board_name) {
      setIsOnBoard(true);
    } else {
      setIsOnBoard(false);
    }
  });

  return <CommunityNavItem_Presenter isOnBoard={isOnBoard} this_board_name={this_board_name} getOnBoard={getOnBoard} />;
}
