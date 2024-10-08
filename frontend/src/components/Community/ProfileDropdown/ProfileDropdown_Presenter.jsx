import '../Community.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ChatMessageModal_Container from '../../NavBar/Chat/ChatMessageModal_Container';

export default function ProfileDropdown_Presenter(props) {
  const { userName, userId, isMine, isLogin, show, onChat, onCloseChat, onProfile } = props;

  return (
    <>
      {userId ? (
        userId === 1 && isMine ? (
          <span>{userName}</span>
        ) : (
          <span className="dropdown-button" style={{ display: 'inline-block' }}>
            {isLogin ? (
              <DropdownButton title={userName} variant="link" style={{ fontSize: '16px' }}>
                {userId !== 1 && <Dropdown.Item onClick={onProfile}>프로필</Dropdown.Item>}
                {!isMine && (
                  <>
                    <Dropdown.Item onClick={onChat}>메시지</Dropdown.Item>
                    <ChatMessageModal_Container show={show} onCloseChatModal={onCloseChat} targetId={userId} />
                  </>
                )}
              </DropdownButton>
            ) : (
              <span style={{ fontSize: '16px' }}>{userName}</span>
            )}
          </span>
        )
      ) : (
        '탈퇴계정'
      )}
    </>
  );
}
