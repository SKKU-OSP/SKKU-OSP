import '../User.css';

function Repository() {
  const guideline = [
    {
      owner_id: 1,
      repo_name: 'dasd',
      create_date: '1231',
      update_date: '1231',
      committer_date: '23123',
      proj_short_desc: '231',
      license: '123',
      star_count: 312,
      watcher_count: 123,
      fork_count: 123,
      commit_count: 123,
      dependency_count: 123,
      close_issue_count: 123,
      open_issue_count: 123,
      pr_count: 123,
      readme: 0
    }
  ];
  let commitDate, createDate, updateDate;
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
            <div class="card d-flex flex-row mx-4 mb-3">
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
                  {repo.proj_short_desc === 'none' ? (
                    <p class="weak-text">프로젝트 설명이 없습니다.</p>
                  ) : (
                    <p>{repo.proj_short_desc}</p>
                  )}

                  <div class="repo-info">
                    <span>
                      <i class="bi bi-star"></i> Stars {repo.star_count}
                    </span>
                    <span>
                      <i class="bi bi-eye-fill"></i> Watchers {repo.watcher_count}
                    </span>
                    <span>
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        version="1.1"
                        data-view-component="true"
                        class="octicon octicon-repo-forked mr-2"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
                        ></path>
                      </svg>{' '}
                      Forks {repo.fork_count}
                    </span>
                    <span>
                      {' '}
                      <i class="bi bi-check-lg"></i> Commits {repo.commit_count}
                    </span>
                    <span>
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        version="1.1"
                        data-view-component="true"
                        class="octicon octicon-git-pull-request UnderlineNav-octicon d-none d-sm-inline"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
                        ></path>
                      </svg>{' '}
                      Pull Requests {repo.pr_count}
                    </span>
                    <span>
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        version="1.1"
                        data-view-component="true"
                        class="octicon octicon-issue-opened"
                      >
                        <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                        <path
                          fill-rule="evenodd"
                          d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
                        ></path>
                      </svg>{' '}
                      Open Issues {repo.open_issue_count}
                    </span>
                    <span>
                      {' '}
                      <i class="bi bi-check-circle"></i> Closed Issues {repo.close_issue_count}
                    </span>
                    <span>
                      {' '}
                      <i class="bi bi-box"></i> Dependencies {repo.dependency_count}
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
                  <div>
                    <div>
                      <i class="bi bi-card-heading"></i>
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
                    <div>
                      <i class="bi bi-book"></i>
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
                    <div>
                      <i class="bi bi-key"></i>
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
                            <i class="bi bi-card-heading"></i>
                            Short desc
                          </span>
                        </li>
                      ) : (
                        <li class="guideline-step-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <i class="bi bi-card-heading"></i>
                            Short desc
                          </span>
                        </li>
                      )}

                      {repo.readme === 0 ? (
                        <li class="guideline-step-item unfinished-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <i class="bi bi-book"></i>
                            README
                          </span>
                        </li>
                      ) : (
                        <li class="guideline-step-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <i class="bi bi-book"></i>
                            README
                          </span>
                        </li>
                      )}

                      {repo.license === 'none' ? (
                        <li class="guideline-step-item unfinished-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <i class="bi bi-key"></i>
                            license
                          </span>
                        </li>
                      ) : (
                        <li class="guideline-step-item">
                          <span class="progress-check"></span>
                          <span class="progress-label">
                            <i class="bi bi-key"></i>
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
