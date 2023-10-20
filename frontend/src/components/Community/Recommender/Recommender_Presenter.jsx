import { useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import styles from './Recommender.module.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

import ChatMessageModal_Container from '../../NavBar/Chat/ChatMessageModal_Container';
import InviteTeamModal from '../Team/InviteTeamModal';

const serverUrl = import.meta.env.VITE_SERVER_URL;
function Recommender_Presenter(props) {
  const { teamMembers, onMyProfile } = props;
  const [showMessage, setShowMessage] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className={styles.recommendBoard}>
      <ChatMessageModal_Container show={showMessage} onCloseChatModal={setShowMessage} />
      <InviteTeamModal show={showInvite} setShow={setShowInvite} />
      {teamMembers.length > 0 ? (
        teamMembers.map((member) => (
          <div key={member.user.id} className={`col-6 d-flex flex-row ${styles.recommendMember}`}>
            <div className="col-4 d-flex justify-content-center align-items-center">
              <img src={serverUrl + member.photo} alt={member.name} className={styles.memberImage} />
            </div>
            <div className="teamMemberInfo col-8 d-flex flex-column gap-2">
              <DropdownButton
                title={member.user.username}
                variant="link"
                style={{ marginTop: '10px', textDecoration: 'none' }}
              >
                <Dropdown.Item onClick={() => onMyProfile(member.user.username)}>프로필</Dropdown.Item>
                <Dropdown.Item onClick={() => setShowMessage(true)}>메세지</Dropdown.Item>
                <Dropdown.Item onClick={() => setShowInvite(true)}>팀 초대하기</Dropdown.Item>
              </DropdownButton>
              <span className={styles.memberIntro}>{member.introduction}</span>
              <div className="d-flex flex-row flex-wrap gap-1">
                {member.interests.slice(0, 5).map((interest) => (
                  <span className={styles.memberTag} key={interest.id}>
                    #{interest.tag.name}
                  </span>
                ))}
                {member.interests.length > 5 && <span className={styles.memberTag}>...</span>}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="mx-auto mt-5">팀원이 없습니다.</div>
      )}
    </div>
  );
}
export default Recommender_Presenter;
