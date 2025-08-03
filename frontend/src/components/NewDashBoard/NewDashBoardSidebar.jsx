import { NavLink, useLocation, useParams } from 'react-router-dom';
import { BsUnindent, BsIndent, BsFillBarChartFill } from 'react-icons/bs';
import { FaShapes } from 'react-icons/fa6';

function NewDashBoardSidebar(props) {
  const { onToggle, isToggled } = props;
  const { username } = useParams();
  const location = useLocation();
  const activeStyle = { color: 'black' };

  const isActive = (path) => location.pathname === path;

  return (
    <div id="sidebar-wrapper">
      <ul className="sidebar-nav" style={{ marginLeft: 0 }}>
        <li className="sidebar-toggle pt-2">
          {isToggled ? (
            <BsIndent size={24} id="menu-toggle" style={{ float: 'right' }} onClick={onToggle} />
          ) : (
            <BsUnindent size={24} id="menu-toggle" style={{ float: 'right' }} onClick={onToggle} />
          )}
        </li>
        <li>
          <NavLink
            to={`/new-dashboard/${username}`}
            style={isActive(`/new-dashboard/${username}`) ? activeStyle : {}}
            className="text-nowrap"
          >
            <BsFillBarChartFill size={24} />
            <span className="sidebar-menu">GitHub 대시보드</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to={`/new-dashboard/${username}/challenge`}
            style={isActive(`/new-dashboard/${username}/challenge`) ? activeStyle : {}}
            className="text-nowrap"
          >
            <FaShapes size={24} />
            <span className="sidebar-menu">챌린지</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default NewDashBoardSidebar;
