import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../../utils/auth';
import { BsStar, BsCheck2, BsArrow90DegLeft } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;
function Activity(props) {
  const { githubId, isEdit } = props;
  const { username } = useParams();
  const [profileActivity, setProfileActivity] = useState();
  const [editProfileActivity, setEditProfileActivity] = useState();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfileActivity = async () => {
      try {
        const getUrl = server_url + '/user/api/profile-activity/' + username + '/';
        const response = await axios.get(getUrl, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setProfileActivity(res.data);
        }
      } catch (error) {}
    };
    getProfileActivity();
  }, []);

  const updatePostProfileActivity = async (editPortfolio) => {
    if (profileActivity.portfolio !== editPortfolio) {
      const postUrl = server_url + '/user/api/profile-intro/' + username + '/';
      await axios.post(postUrl, { portfolio: editPortfolio }, getAuthConfig());
    }
  };
  const handleEditClick = () => {
    setEditProfileActivity(profileActivity);
    setEditing(true);
  };
  const handleSaveClick = () => {
    updatePostProfileActivity(editProfileActivity.portfolio);
    setProfileActivity(editProfileActivity);
    setEditing(false);
  };
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditProfileActivity({
      ...editProfileActivity,
      [name]: value
    });
  };
  const handleUrlClick = (url) => {
    navigate(url);
  };

  return (
    <>
      {profileActivity ? (
        <div className="profile-activity">
          <div className="d-flex flex-column justify-content-start profile-portfolio">
            <div className="d-flex flex-row justify-content-between portfolio-intro">
              <span className="intro">포트폴리오</span>
              {isEdit &&
                (editing ? (
                  <button className="btn" onClick={handleSaveClick} style={{ backgroundColor: 'black' }}>
                    <span className="btn-text" style={{ color: 'white' }}>
                      저장
                    </span>
                  </button>
                ) : (
                  <button className="btn" onClick={handleEditClick}>
                    <span className="btn-text">수정</span>
                  </button>
                ))}
            </div>
            <div className="portfolio-text">
              {editing ? (
                <textarea
                  name="portfolio"
                  rows="4"
                  style={{ width: '100%', whiteSpace: 'pre-wrap' }}
                  value={editProfileActivity.portfolio}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="text">
                  {profileActivity.portfolio.length > 0 ? (
                    <>
                      {profileActivity.portfolio.split('\n').map((line, idx) => {
                        return (
                          <span key={`portfolio-${idx}`}>
                            {line}
                            <br />
                          </span>
                        );
                      })}
                    </>
                  ) : (
                    <>포트폴리오를 작성하지 않았습니다.</>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="d-flex flex-column justify-content-start profile-contribution">
            <div className="d-flex flex-row justify-content-between contribution-intro">
              <span className="intro">최근 기여활동</span>
              <a
                onClick={() => {
                  handleUrlClick(`/repository/${username}`);
                }}
                className="href"
                style={{ cursor: 'pointer' }}
              >
                자세히 알아보기 &gt;
              </a>
            </div>
            {profileActivity.recent_repos.length > 0 ? (
              <>
                {profileActivity.recent_repos.map((repo, idx) => {
                  return (
                    <div className="contribution-repo" key={idx}>
                      <div className="d-flex flex-column justify-content-start repo">
                        <div className="d-flex flex-row justify-content-between title">
                          <span className="title-text">{repo.repo_name}</span>
                          <span className="commit-date">
                            최근 커밋일자
                            <br />
                            {repo.committer_date.substring(0, 10)}
                          </span>
                        </div>
                        <div className="d-flex flex-row justify-content-start gap-1 stat">
                          <BsStar size={16} />
                          <span className="stat-text">Stars {repo.stargazers_count}</span>
                          <BsCheck2 size={16} />
                          <span className="stat-text">Commits {repo.commits_count}</span>
                          <BsArrow90DegLeft size={16} />
                          <span className="stat-text">Pull Requests {repo.prs_count}</span>
                        </div>
                        <span className="desc">{repo.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>최근 기여활동이 없습니다.</>
            )}
          </div>
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default Activity;
