import { NavLink, useParams } from 'react-router-dom';
import { BsUnindent, BsIndent, BsFillPersonFill, BsFillBarChartFill } from 'react-icons/bs';
import { FaShapes } from 'react-icons/fa6';

function Sidebar(props) {
  const { onToggle, isToggled } = props;
  const username = useParams().username;
  const activeStyle = { color: 'black' };

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
            to={`/user/${username}/profile`}
            style={({ isActive }) => (isActive ? activeStyle : {})}
            className="text-nowrap"
          >
            <BsFillPersonFill size={24} />
            <span className="sidebar-menu">프로필</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to={`/user/${username}/dashboard`}
            style={({ isActive }) => (isActive ? activeStyle : {})}
            className="text-nowrap"
          >
            <BsFillBarChartFill size={24} />
            <span className="sidebar-menu">대시보드</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to={`/user/${username}/dev-type`}
            style={({ isActive }) => (isActive ? activeStyle : {})}
            className="text-nowrap"
          >
            <FaShapes size={24} />
            <span className="sidebar-menu">개발자 유형</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
