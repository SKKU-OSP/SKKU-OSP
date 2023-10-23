import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Badge from 'react-bootstrap/Badge';

import { getAuthConfig } from '../../../utils/auth';
import './TeamApplication.css';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const applyUrl = serverUrl + '/team/api/team-apply-update/';
const deleteUrl = serverUrl + '/team/api/team-apply-delete/';
const TeamApplication = ({ handleClose, show }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [receivedLength, setReceivedLength] = useState(0);
  const [sentLength, setSentLength] = useState(0);

  useEffect(() => {
    const getApplications = async () => {
      try {
        const url = serverUrl + '/team/api/applications';
        const response = await axios.get(url, getAuthConfig());
        const res = response.data;
        console.log(res);
        if (res.status === 'fail') {
          console.log(res.status, res.errors);
        } else {
          setReceived(res.data.received);
          setSent(res.data.sent);
          setReceivedLength(res.data.received.length);
          setSentLength(res.data.sent.length);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (show) {
      getApplications();
    }
  }, [show]);

  //AXIOS POST
  const sendTeamApplication = async (id, userId, status) => {
    try {
      const data = { target_teamapplymessage_id: id, is_okay: status, user_id: userId };
      console.log(data);
      const response = await axios.post(applyUrl, data, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.status, res.errors);
      } else {
        console.log(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const sendDeleteApplication = async (id) => {
    try {
      const data = { target_teamapplymessage_id: id };
      console.log(data);
      const response = await axios.post(deleteUrl, data, getAuthConfig());
      const res = response.data;
      if (res.status === 'fail') {
        console.log(res.status, res.errors);
      } else {
        console.log(res.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const tabClickHandler = (index) => {
    setActiveIndex(index);
  };

  const handleApproveClick = (applyId, userId) => {
    sendTeamApplication(applyId, userId, 'true');
    setReceived((prev) => prev.filter((app) => app.id !== applyId));
  };

  const handleRefuseClick = (applyId, userId) => {
    sendTeamApplication(applyId, userId, 'false');
    setReceived((prev) => prev.filter((app) => app.id !== applyId));
  };

  const handleDeleteClick = (applyId) => {
    sendDeleteApplication(applyId);
    setSent((prev) => prev.filter((app) => app.id !== applyId));
  };

  const clickUsername = (name) => {
    window.open(`/user/${name}`, '_blank');
    handleClose();
  };

  const tabContArr = [
    {
      tabTitle: (
        <Nav.Link
          key="recv-tab"
          className={activeIndex === 0 ? 'SelectedNavItem' : 'UnselectedNavItem'}
          onClick={() => tabClickHandler(0)}
        >
          받은 지원서
        </Nav.Link>
      ),
      tabCont: (
        <>
          {receivedLength === 0 ? (
            <div className="EmptyApp">받은 지원서가 없습니다!</div>
          ) : (
            received.map((application) => (
              <div
                key={`recv-${application.id}`}
                className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0"
              >
                <div className="d-flex">
                  <div className="me-2">
                    {' '}
                    {application.team.name} {application.team.id}{' '}
                  </div>
                  <Link onClick={() => clickUsername(application.account.user.username)}>
                    {application.account.user.username}
                  </Link>
                </div>
                <div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    id={application.id}
                    className="text-dark me-2"
                    onClick={() => {
                      handleRefuseClick(application.id, application.account.user.id);
                    }}
                  >
                    거절
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    id={application.id}
                    className="text-dark me-2"
                    onClick={() => {
                      handleApproveClick(application.id, application.account.user.id);
                    }}
                  >
                    수락
                  </Button>
                </div>
              </div>
            ))
          )}
        </>
      )
    },
    {
      tabTitle: (
        <Nav.Link
          key="sent-tab"
          className={activeIndex === 1 ? 'SelectedNavItem' : 'UnselectedNavItem'}
          onClick={() => tabClickHandler(1)}
        >
          보낸 지원서
        </Nav.Link>
      ),
      tabCont: (
        <>
          {sentLength === 0 ? (
            <div className="EmptyApp">보낸 지원서가 없습니다!</div>
          ) : (
            sent.map((application) => (
              <div
                key={`sent-${application.id}`}
                className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0 gap-2"
              >
                <div>{application.team.name}</div>
                <div className="d-flex flex-row">
                  {application.status === 1 ? (
                    <Badge bg="primary" className="text-center text-left fs-6 me-2 lh-sm">
                      승인됨
                    </Badge>
                  ) : (
                    <Badge bg="danger" className="text-center text-left fs-6 me-2 lh-sm">
                      거절됨
                    </Badge>
                  )}

                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="text-dark me-2"
                    onClick={() => handleDeleteClick(application.id)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))
          )}
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
                {tabContArr.map((section) => {
                  return section.tabTitle;
                })}
              </Container>
            </Navbar>

            <div className="AppBody">{tabContArr[activeIndex].tabCont}</div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TeamApplication;
