import '../../Community.css';

export default function CommunityNavItem(props) {
  const { isOnBoard, this_board_name, getOnBoard } = props;

  return (
    <li className={isOnBoard ? 'nav-item selected-nav-item' : 'nav-item unselected-nav-item'}>
      <div onClick={getOnBoard}>{this_board_name}</div>
    </li>
  );
}
