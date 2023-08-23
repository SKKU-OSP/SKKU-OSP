import Spinner from 'react-bootstrap/Spinner';
import styles from './Recommender.module.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
function Recommender_Presenter(props) {
  const teams = props.teams;
  const teamMembers = props.teamMembers;
  const selectedTeam = props.selectedTeam;
  const onMyProfile = props.onMyProfile;
  const handleItemClick = props.handleItemClick;
  return (
    <div className="col-9">
      <div className={styles.recommendBar}>
        <DropdownButton id="dropdown-basic-button" title={selectedTeam.name} variant="secondary">
          {teams.map((team) => (
            <Dropdown.Item onClick={() => handleItemClick(team)} key={team.id}>
              {team.name}
            </Dropdown.Item>
          ))}
        </DropdownButton>
        <span className={styles.recommendTitle}>'{selectedTeam.name}'팀 맞춤 유저 추천</span>
        <DropdownButton
          id="dropdown-basic-button"
          title={selectedTeam.name}
          variant="secondary"
          style={{ visibility: 'hidden' }}
        >
          {teams.map((team) => {
            <Dropdown.Item onClick={() => handleItemClick(team.id)} key={team.id}>
              {team.name}
            </Dropdown.Item>;
          })}
        </DropdownButton>
      </div>
      <div className={styles.recommendBoard}>
        {teamMembers ? (
          <>
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div key={member.user.id} className={`col-6 d-flex flex-row ${styles.recommendMember}`}>
                  <div className="col-4 d-flex justify-content-center align-items-center">
                    <img src={member.photo} alt={member.name} className={styles.memberImage} />
                  </div>
                  <div className="teamMemberInfo col-8 d-flex flex-column gap-2">
                    <DropdownButton
                      title={member.user.username}
                      variant="link"
                      style={{ marginTop: '10px', textDecoration: 'none' }}
                    >
                      <Dropdown.Item onClick={() => onMyProfile(member.user.username)}>프로필</Dropdown.Item>
                      <Dropdown.Item>메세지</Dropdown.Item>
                      <Dropdown.Item>팀 초대하기</Dropdown.Item>
                    </DropdownButton>
                    <span className={styles.memberIntro}>{member.introduction}</span>
                    <div className="d-flex flex-row flex-wrap gap-1">
                      {member.interests.slice(0, 5).map((interest, index) => (
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
              <>팀원이 없습니다.</>
            )}
          </>
        ) : (
          <Spinner animation="border" style={{ position: 'absolute', top: '50%', left: '50%' }} />
        )}
      </div>
    </div>
  );
}
export default Recommender_Presenter;
