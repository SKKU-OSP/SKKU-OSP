import '../../Community.css';

export default function CommunityNavItem(props) {
  const { isActive, navName, onNavigate } = props;

  return (
    <li className={isActive ? 'nav-item selected-nav-item' : 'nav-item unselected-nav-item'}>
      <div onClick={onNavigate}>{navName}</div>
    </li>
  );
}
