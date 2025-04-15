import { useEffect, useState } from 'react';
import '../User.css';
import {
  BsStar,
  BsEye,
  BsCheckLg,
  BsCheckCircle,
  BsRecordCircle,
  BsBox,
  BsCardHeading,
  BsBook,
  BsKey
} from 'react-icons/bs';
import { PiGitForkBold, PiGitPullRequestBold } from 'react-icons/pi';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';
import LoaderIcon from 'react-loader-icon';

const server_url = import.meta.env.VITE_SERVER_URL;

function Repository() {
  const { username } = useParams();
  const [guideline, setGuideline] = useState();
  const [error_occur, setError] = useState(false);
  useEffect(() => {
    const getGuideLine = async () => {
      try {
        const url = server_url + '/user/api/guideline/' + username + '/';
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'success') {
          setGuideline(res.data.guideline);
        }
      } catch (error) {
        setError(true);
      }
    };
    getGuideLine();
  }, []);
  return (
    <>
      {error_occur ? (
        <>잘못된 페이지입니다.</>
      ) : guideline ? (
        <div className="container mb-4">
          <div className="community-nav d-flex" style={{ marginLeft: '10px' }}>
            <div className="nav nav-fill">
              <li className="nav-item selected-nav-item">
                <div>Guideline</div>
              </li>
            </div>
          </div>

          {guideline.length > 0 ? (
            guideline.map((repo, index) => (
              <div className="card guideline-check mx-4 mb-3" key={`card-${index}`}>
                <div className="card-half">
                  <div className="card-body">
                    <div className="card-title d-flex justify-content-between">
                      <div className="card-title-block">
                        <a href={`https://github.com/${repo.owner_id}/${repo.repo_name}`} target="_blank">
                          <h5>{repo.repo_name}</h5>
                        </a>
                        {repo.contributors_count > 1 ? (
                          <span className="weak-text">팀프로젝트 created by {repo.owner_id}</span>
                        ) : (
                          <span className="weak-text">개인프로젝트 created by {repo.owner_id}</span>
                        )}
                      </div>
                      <div className="card-title-block text-right">
                        <span className="weak-text text-right">최근 커밋일자</span>
                        <span className="weak-text">
                          {repo.committer_date.split('T')[0] + ' ' + repo.committer_date.split('T')[1].substring(0, 5)}
                        </span>
                      </div>
                    </div>
                    <div className="repo-desc">
                      {repo.proj_short_desc === null ? (
                        <p className="weak-text">프로젝트 설명이 없습니다.</p>
                      ) : (
                        <p className="weak-text-lg">{repo.proj_short_desc}</p>
                      )}
                    </div>
                    <div className="repo-info">
                      <span>
                        <BsStar /> Stars {repo.star_count}
                      </span>
                      <span>
                        <BsEye /> Watchers {repo.watcher_count}
                      </span>
                      <span>
                        <PiGitForkBold /> Forks {repo.fork_count}
                      </span>
                      <span>
                        <BsCheckLg /> Commits {repo.commit_count}
                      </span>
                      <span>
                        <PiGitPullRequestBold />
                        Pull Requests {repo.pr_count}
                      </span>
                      <span>
                        <BsRecordCircle />
                        Open Issues {repo.open_issue_count}
                      </span>
                      <span>
                        <BsCheckCircle /> Closed Issues {repo.close_issue_count}
                      </span>
                      <span>
                        <BsBox /> Dependencies {repo.dependency_count}
                      </span>
                    </div>
                    <div className="card-title-block text-right">
                      <span className="weak-text">
                        생성 날짜{' '}
                        {repo.create_date.split('T')[0] + ' ' + repo.create_date.split('T')[1].substring(0, 5)}
                      </span>
                      <span className="weak-text">
                        업데이트 날짜
                        {repo.update_date.split('T')[0] + ' ' + repo.update_date.split('T')[1].substring(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-half">
                  <div className="card-body d-flex flex-column justify-content-between h-100">
                    <div className="repo-git">
                      <div className="repo-git-info">
                        <BsCardHeading />
                        {repo.proj_short_desc === null ? (
                          <>
                            <span className="weak-text-lg">리포지토리 Description 없음</span>
                            <span className="progress-uncheck-sm"></span>
                          </>
                        ) : (
                          <>
                            <span>{repo.proj_short_desc}</span>
                            <span className="progress-check-sm"></span>
                          </>
                        )}
                      </div>
                      <div className="repo-git-info">
                        <BsBook />
                        {repo.readme === 0 ? (
                          <>
                            <span className="weak-text-lg">README 파일 없음</span>
                            <span className="progress-uncheck-sm"></span>
                          </>
                        ) : (
                          <>
                            <span>README 작성완료</span>
                            <span className="progress-check-sm"></span>
                          </>
                        )}
                      </div>
                      <div className="repo-git-info">
                        <BsKey />
                        {repo.license === null ? (
                          <>
                            <span className="weak-text-lg">License 파일 없음</span>
                            <span className="progress-uncheck-sm"></span>
                          </>
                        ) : (
                          <>
                            <span>{repo.license}</span>
                            <span className="progress-check-sm"></span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="guideline-step">
                      <ul className="guideline-step-list">
                        {repo.proj_short_desc === null ? (
                          <li className="guideline-step-item unfinished-item">
                            <span className="progress-check"></span>
                            <span className="progress-label">
                              <BsCardHeading />
                              Short desc
                            </span>
                          </li>
                        ) : (
                          <li className="guideline-step-item">
                            <span className="progress-check"></span>
                            <span className="progress-label">
                              <BsCardHeading />
                              Short desc
                            </span>
                          </li>
                        )}

                        {repo.readme === 0 ? (
                          <li className="guideline-step-item unfinished-item">
                            <span className="progress-check"></span>
                            <span className="progress-label">
                              <BsBook />
                              README
                            </span>
                          </li>
                        ) : (
                          <li className="guideline-step-item">
                            <span className="progress-check"></span>
                            <span className="progress-label">
                              <BsBook />
                              README
                            </span>
                          </li>
                        )}

                        {repo.license === null ? (
                          <li className="guideline-step-item unfinished-item">
                            <span className="progress-check"></span>
                            <span className="progress-label">
                              <BsKey />
                              license
                            </span>
                          </li>
                        ) : (
                          <li className="guideline-step-item">
                            <span className="progress-check"></span>
                            <span className="progress-label">
                              <BsKey />
                              license
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <p>GitHub 리포지토리 정보가 없어 가이드라인을 제공할 수 없습니다.</p>
              <p>1. 시스템이 아직 수집하지 않았을 수 있습니다. 내일 다시 방문해주세요.</p>
              <p>2. 혹시 리포지토리를 생성하지 않았거나 기여내역이 없나요? GitHub 활동에 참여해보세요!</p>
            </>
          )}
        </div>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}
export default Repository;
