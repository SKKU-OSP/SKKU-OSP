import '../User.css';
import {
  BsStar,
  BsEyeFill,
  BsCheckLg,
  BsCheckCircle,
  BsRecordCircle,
  BsBox,
  BsCardHeading,
  BsBook,
  BsKey,
  BsCheckCircleFill
} from 'react-icons/bs';
import { PiGitForkBold, PiGitPullRequestBold } from 'react-icons/pi';

function Repository() {
  const guideline = [
    {
      owner_id: 'SeoJeongYeop',
      repo_name: 'SeoJeongYeop',
      create_date: '1231',
      update_date: '1231',
      committer_date: '23123',
      proj_short_desc: 'none',
      license: 'none',
      star_count: 312,
      watcher_count: 123,
      fork_count: 123,
      commit_count: 123,
      dependency_count: 123,
      close_issue_count: 123,
      open_issue_count: 123,
      pr_count: 123,
      readme: 1
    },
    {
      owner_id: 'SeoJeongYeop',
      repo_name: 'SeoJeongYeop',
      create_date: '1231',
      update_date: '1231',
      committer_date: '23123',
      proj_short_desc: 'none',
      license: 'none',
      star_count: 312,
      watcher_count: 123,
      fork_count: 123,
      commit_count: 123,
      dependency_count: 123,
      close_issue_count: 123,
      open_issue_count: 123,
      pr_count: 123,
      readme: 1
    },
    {
      owner_id: 'SeoJeongYeop',
      repo_name: 'SeoJeongYeop',
      create_date: '1231',
      update_date: '1231',
      committer_date: '23123',
      proj_short_desc: 'none',
      license: 'none',
      star_count: 312,
      watcher_count: 123,
      fork_count: 123,
      commit_count: 123,
      dependency_count: 123,
      close_issue_count: 123,
      open_issue_count: 123,
      pr_count: 123,
      readme: 1
    }
  ];
  let commitDate = '2023-06-13 14:59',
    createDate = '2023-03-10 07:47',
    updateDate = '2023-03-10 07:47';
  {
    /* if (guideline !== null) {
    let dateObject, hours, minutes, period, formattedHours;

    dateObject = new Date(guideline.committer_date);
    commitDate = dateObject.toISOString().slice(0, 10);
    hours = dateObject.getHours();
    minutes = dateObject.getMinutes();
    period = hours >= 12 ? 'p.m.' : 'a.m.';
    formattedHours = hours % 12 || 12;
    commitDate = commitDate + `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;

    dateObject = new Date(guideline.create_date);
    createDate = dateObject.toISOString().slice(0, 10);
    hours = dateObject.getHours();
    minutes = dateObject.getMinutes();
    period = hours >= 12 ? 'p.m.' : 'a.m.';
    formattedHours = hours % 12 || 12;
    createDate = commitDate + `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;

    dateObject = new Date(guideline.update_date);
    updateDate = dateObject.toISOString().slice(0, 10);
    hours = dateObject.getHours();
    minutes = dateObject.getMinutes();
    period = hours >= 12 ? 'p.m.' : 'a.m.';
    formattedHours = hours % 12 || 12;
    updateDate = commitDate + `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } */
  }

  return (
    <div class="container my-4">
      <h3>Guideline</h3>
      {guideline.length > 0 ? (
        guideline.map((repo, index) => (
          <>
            <div class="card guideline-check mx-4 mb-3">
              <div class="card-half">
                <div class="card-body">
                  <div class="card-title d-flex justify-content-between">
                    <div class="card-title-block">
                      <a href={`https://github.com/${repo.owner_id}/${repo.repo_name}`} target="_blank">
                        <h5>{repo.repo_name}</h5>
                      </a>
                      {repo.contributors_count > 1 ? (
                        <span class="weak-text">팀프로젝트 created by {repo.owner_id}</span>
                      ) : (
                        <span class="weak-text">개인프로젝트 created by {repo.owner_id}</span>
                      )}
                    </div>
                    <div class="card-title-block text-right">
                      <span class="weak-text text-right">최근 커밋일자</span>
                      <span class="weak-text">{commitDate}</span>
                    </div>
                  </div>
                  <div class="repo-desc">
                    {repo.proj_short_desc === 'none' ? (
                      <p class="weak-text">프로젝트 설명이 없습니다.</p>
                    ) : (
                      <p className="weak-text-lg">{repo.proj_short_desc}</p>
                    )}
                  </div>
                  <div class="repo-info">
                    <span>
                      <BsStar /> Stars {repo.star_count}
                    </span>
                    <span>
                      <BsEyeFill /> Watchers {repo.watcher_count}
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
                  <div class="card-title-block text-right">
                    <span class="weak-text">생성 날짜 {createDate}</span>
                    <span class="weak-text">업데이트 날짜 {updateDate}</span>
                  </div>
                </div>
              </div>
              <div class="card-half">
                <div class="card-body d-flex flex-column justify-content-between h-100">
                  <div class="repo-git">
                    <div class="repo-git-info">
                      <BsCardHeading />
                      {repo.proj_short_desc === 'none' ? (
                        <>
                          <span class="weak-text-lg">리포지토리 Description 없음</span>
                          <span class="progress-uncheck-sm"></span>
                        </>
                      ) : (
                        <>
                          <span>{repo.proj_short_desc}</span>
                          <span class="progress-check-sm"></span>
                        </>
                      )}
                    </div>
                    <div class="repo-git-info">
                      <BsBook />
                      {repo.readme === 0 ? (
                        <>
                          <span class="weak-text-lg">README 파일 없음</span>
                          <span class="progress-uncheck-sm"></span>
                        </>
                      ) : (
                        <>
                          <span>README 작성완료</span>
                          <span class="progress-check-sm"></span>
                        </>
                      )}
                    </div>
                    <div class="repo-git-info">
                      <BsKey />
                      {repo.license === 'none' ? (
                        <>
                          <span class="weak-text-lg">License 파일 없음</span>
                          <span class="progress-uncheck-sm"></span>
                        </>
                      ) : (
                        <>
                          <span>{repo.license}</span>
                          <span class="progress-check-sm"></span>
                        </>
                      )}
                    </div>
                  </div>
                  <div class="guideline-step">
                    <ul class="guideline-step-list">
                      {repo.proj_short_desc === 'none' ? (
                        <li class="guideline-step-item unfinished-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <BsCardHeading />
                            Short desc
                          </span>
                        </li>
                      ) : (
                        <li class="guideline-step-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <BsCardHeading />
                            Short desc
                          </span>
                        </li>
                      )}

                      {repo.readme === 0 ? (
                        <li class="guideline-step-item unfinished-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <BsBook />
                            README
                          </span>
                        </li>
                      ) : (
                        <li class="guideline-step-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <BsBook />
                            README
                          </span>
                        </li>
                      )}

                      {repo.license === 'none' ? (
                        <li class="guideline-step-item unfinished-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <BsKey />
                            license
                          </span>
                        </li>
                      ) : (
                        <li class="guideline-step-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
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
          </>
        ))
      ) : (
        <>
          <p>GitHub 리포지토리 정보가 없어 가이드라인을 제공할 수 없습니다.</p>
          <p>1. 시스템이 아직 수집하지 않았을 수 있습니다. 내일 다시 방문해주세요.</p>
          <p>2. 혹시 리포지토리를 생성하지 않았거나 기여내역이 없나요? GitHub 활동에 참여해보세요!</p>
        </>
      )}
    </div>
  );
}
export default Repository;
