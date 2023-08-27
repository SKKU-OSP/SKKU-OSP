export default function TeamOverview(props) {
  const { team } = props;

  return (
    <div className="board-article">
      <div>
        <h4 className="board-article-title2">{team.name}</h4>
        <div className="board-article-modal"></div>
      </div>
      <div>
        <h6 className="inline-block">{team.description}</h6>
        <div className="text-end">익명 외 몇 명</div>
      </div>
    </div>
  );
}
