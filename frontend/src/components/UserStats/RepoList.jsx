import React from "react";
import RepoCard from "./RepoCard";

function RepoList({ repositories }) {
  return (
    <div className="repo-list-container">
      <h2>
        기여한 리포지토리
        <span className="repo-count-badge">{repositories.length}</span>
      </h2>
      <div className="repo-list">
        {repositories.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
}

export default RepoList;