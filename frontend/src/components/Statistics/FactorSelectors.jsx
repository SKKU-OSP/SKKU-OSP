import Nav from 'react-bootstrap/Nav';

function FactorSelectors({ factor, onSetFactor }) {
  const handleSelect = (eventKey) => {
    console.log('hello', eventKey);
    onSetFactor(eventKey);
  };
  return (
    <Nav variant="underline" onSelect={handleSelect} defaultActiveKey={factor} className="mt-4">
      <Nav.Item className="flex-tab text-center">
        <Nav.Link eventKey="score">Score</Nav.Link>
      </Nav.Item>
      <Nav.Item className="flex-tab text-center">
        <Nav.Link eventKey="commit">Commits</Nav.Link>
      </Nav.Item>
      <Nav.Item className="flex-tab text-center">
        <Nav.Link eventKey="star">Stars</Nav.Link>
      </Nav.Item>
      <Nav.Item className="flex-tab text-center">
        <Nav.Link eventKey="pr">PR</Nav.Link>
      </Nav.Item>
      <Nav.Item className="flex-tab text-center">
        <Nav.Link eventKey="issue">Issues</Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default FactorSelectors;
