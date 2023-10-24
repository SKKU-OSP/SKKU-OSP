import { ProgressBar } from 'react-bootstrap';
import './TestType.css';

const ResultProgress = (factor) => {
  const q = factor.factor;
  const leftLength = String((100 - q) / 2 - 3) + '%';
  const rightLength = String((100 + q) / 2 + ((100 + q) % 2) - 3) + '%';
  console.log(leftLength, rightLength, factor.factor);
  return (
    <div className="d-flex" style={{ backgroundColor: '#E2E2E2' }}>
      <div style={{ height: '10px', width: leftLength, backgroundColor: '#E2E2E2' }}></div>
      <div style={{ height: '10px', width: '6%', backgroundColor: 'rgb(0, 39, 67)', borderRadius: '4px' }}></div>
      <div style={{ height: '10px', width: rightLength, backgroundColor: '#E2E2E2' }}></div>
    </div>
    // <ProgressBar>
    //   <ProgressBar className="progress" now={leftLength} key={1} />
    //   <ProgressBar className="prgressBlock" now={4} key={2} />
    //   <ProgressBar className="progress" now={rightLength} key={3} />
    // </ProgressBar>
  );
};

export default ResultProgress;
