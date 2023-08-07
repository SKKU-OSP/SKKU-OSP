function FactorSelectors() {
  return (
    <ul className="nav nav-tabs mt-4 d-flex text-lg">
      <li className="nav-item">
        <a className="nav-link border-round active" id="pills-score-tab">
          Score
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link border-round" id="pills-commits-tab">
          Commits
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link border-round" id="pills-stars-tab">
          Stars
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link border-round" id="pills-pr-tab">
          PR
        </a>
      </li>
      <li className="nav-item">
        <a className="nav-link border-round" id="pills-issue-tab">
          Issues
        </a>
      </li>
    </ul>
  );
}

export default FactorSelectors;
