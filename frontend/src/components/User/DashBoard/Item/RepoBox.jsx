import { LuCheck, LuPencil, LuCornerUpLeft, LuCircleDot } from 'react-icons/lu';

export default function RepoBox(props) {
  const borderStyle = {
    borderTop: '1px var(--gray-300) solid'
  };
  const numberWithCommas = (x) => {
    if (typeof x === 'number') return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    else return x;
  };
  const repoName = props.repoName;
  const commits = numberWithCommas(props.commits);
  const commitLines = numberWithCommas(props.commitLines);
  const prs = numberWithCommas(props.prs);
  const issues = numberWithCommas(props.issues);

  return (
    <div className="p-2 mb-3" style={borderStyle}>
      <div className="fs-4 bold mb-2" style={{ wordBreak: 'break-all' }}>
        {repoName}
      </div>
      <div className="d-flex gap-2 fs-6 mb-1">
        <LuCheck size={20} /> Commits
        <span>{numberWithCommas(commits)}</span>
      </div>
      <div className="d-flex gap-2 fs-6 mb-1">
        <LuPencil size={20} /> Commit Lines
        <span>{numberWithCommas(commitLines)}</span>
      </div>
      <div className="d-flex gap-2 fs-6 mb-1">
        <LuCornerUpLeft size={20} /> Pull Requests
        <span>{numberWithCommas(prs)}</span>
      </div>
      <div className="d-flex gap-2 fs-6 mb-1">
        <LuCircleDot size={20} /> Issues
        <span>{numberWithCommas(issues)}</span>
      </div>
    </div>
  );
}
