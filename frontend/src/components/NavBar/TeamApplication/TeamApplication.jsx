import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import axios from 'axios';
import { getAuthConfig } from '../../../utils/auth';

import './TeamApplication.css';
import { ToggleButton } from 'react-bootstrap';

const TeamApplication = ({ handleClose, show }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabClickHandler = (index) => {
    setActiveIndex(index);
  };

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const url = serverUrl + '/team/api/applications';
  useEffect(() => {
    const getApplications = async () => {
      try {
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        if (res.status === 'fail') {
          console.log(res.status, res.errors);
        } else {
          setReceived(res.data.received);
          setSent(res.data.sent);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getApplications();
  });

  const tabContArr = [
    {
      tabTitle: (
        <Nav.Link
          className={activeIndex === 0 ? 'SelectedNavItem' : 'UnselectedNavItem'}
          onClick={() => tabClickHandler(0)}
        >
          받은 지원서
        </Nav.Link>
      ),
      tabCont: (
        <>
          {received &&
            received.map((application) => (
              <div className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0">
                <div className="d-flex">
                  <div className="me-2"> {application.team.name} </div>
                  <Link>{application.account.user.username}</Link>
                </div>
                <div>
                  <Button variant="outline-danger" size="sm" className="text-dark me-2">
                    거절
                  </Button>
                  <Button variant="outline-primary" size="sm" className="text-dark me-2">
                    수락
                  </Button>
                </div>
              </div>
            ))}
        </>
      )
    },
    {
      tabTitle: (
        <Nav.Link
          className={activeIndex === 1 ? 'SelectedNavItem' : 'UnselectedNavItem'}
          onClick={() => tabClickHandler(1)}
        >
          보낸 지원서
        </Nav.Link>
      ),
      tabCont: (
        <>
          {sent &&
            sent.map((application) => (
              <div className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0">
                <div className="d-flex">
                  <div className="me-2"> {application.team.name} </div>
                </div>
                <div>
                  {application.status === 1 ? (
                    <Badge bg="primary" className="text-center text-left fs-6 me-2">
                      승인됨
                    </Badge>
                  ) : (
                    <Badge bg="danger" className="text-center text-left fs-6 me-2">
                      거절됨
                    </Badge>
                  )}

                  <Button variant="outline-danger" size="sm" className="text-dark me-2">
                    삭제
                  </Button>
                </div>
              </div>
            ))}
        </>
      )
    }
  ];

  return (
    <>
      <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            <h5>팀 지원서 목록</h5>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <Navbar collapseOnSelect className="tabs is-boxed d-flex flex-row justify-content-center w-100">
              <Container>
                {tabContArr.map((section, index) => {
                  return section.tabTitle;
                })}
              </Container>
            </Navbar>
            <div>{tabContArr[activeIndex].tabCont}</div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TeamApplication;
