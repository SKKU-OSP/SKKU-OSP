import IconList_Presenter from './IconList_Presenter';

function IconList_Container(props) {
  const iconSize = '24';

  return <IconList_Presenter iconSize={iconSize} username={props.username} />;
}

export default IconList_Container;
