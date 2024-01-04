import { Link } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';

function ContribModal({ show, setShow, contribData }) {
  const contribPannel = {
    name: 'Name',
    github_id: 'GitHub Id',
    commit_cnt: 'Commits',
    issue_cnt: 'Issues',
    pull_cnt: 'Pulls'
  };

  return (
    <Modal size="md" show={show} onHide={() => setShow(false)}>
      <Modal.Header closeButton>
        <Modal.Title>학생 기여 정보</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row text-center gap-2 justify-content-between">
          {Object.keys(contribPannel).map((col) => {
            return (
              <div key={col} className="d-flex flex-column gap-2">
                <div>{contribPannel[col]}</div>
                {contribData.map((contrib, idx) => {
                  if (col === 'github_id')
                    return (
                      <div key={`${col}-${idx}`}>
                        <Link to={`https://github.com/${contrib[col]}`} target="_blank">
                          {contrib[col]}
                        </Link>
                      </div>
                    );

                  return <div key={`${col}-${idx}`}>{contrib[col]}</div>;
                })}
              </div>
            );
          })}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default ContribModal;
