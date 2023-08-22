import Nav from 'react-bootstrap/Nav';

function FactorSelectors({ factor, onSetFactor, factors }) {
  const handleSelect = (eventKey) => {
    onSetFactor(eventKey);
  };
  const factorTitleMap = {
    score: 'Score',
    commit: 'Commits',
    star: 'Stars',
    pr: 'PR',
    issue: 'Issues'
  };
  return (
    <Nav variant="underline" onSelect={handleSelect} defaultActiveKey={factor} className="mt-4">
      {factors &&
        factors.map((item) => {
          return (
            <Nav.Item key={item} className="flex-tab text-center">
              <Nav.Link eventKey={item}>{factorTitleMap[item]}</Nav.Link>
            </Nav.Item>
          );
        })}
    </Nav>
  );
}

export default FactorSelectors;
