import CommunityNavItem_Presenter from './CommunityNavItem_Presenter';
import { useNavigate } from 'react-router-dom';

export default function CommunityNavItem_Container(props) {
  const { navName, tabName, setNowPage } = props;
  const navigate = useNavigate();
  const isActive = navName === tabName;

  const onNavigate = () => {
    navigate(`./../${navName}`);
    setNowPage(1);
  };

  return <CommunityNavItem_Presenter isActive={isActive} navName={navName} onNavigate={onNavigate} />;
}
