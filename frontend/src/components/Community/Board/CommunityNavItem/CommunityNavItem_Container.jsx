import CommunityNavItem_Presenter from './CommunityNavItem_Presenter';
import { useNavigate } from 'react-router-dom';

export default function CommunityNavItem_Container(props) {
  const { navName, tabName, urlTabName } = props;
  const navigate = useNavigate();
  const isActive = urlTabName === tabName;

  const onNavigate = () => {
    navigate(`./../${urlTabName}`);
  };

  return <CommunityNavItem_Presenter isActive={isActive} navName={navName} onNavigate={onNavigate} />;
}
