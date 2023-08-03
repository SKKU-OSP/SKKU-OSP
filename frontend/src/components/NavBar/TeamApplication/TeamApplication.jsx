import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Dropdown from 'react-bootstrap/Dropdown';

import classes from './TeamApplication.module.css';

const TeamApplication = () => {
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show, setShow] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const tabClickHandler = (index) => {
    setActiveIndex(index);
  };

  const tabContArr = [
    {
      tabTitle: (
        <Nav.Link
          className={activeIndex === 0 ? classes.SelectedNavItem : classes.UnselectedNavItem}
          onClick={() => tabClickHandler(0)}
        >
          받은 지원서
        </Nav.Link>
      ),
      tabCont: (
        <>
          <div className="d-flex justify-content-between border border-start-0 border-end-0">
            <Dropdown> ChatGPT 개발자 되기 </Dropdown>
            <div>
              <button>거절</button>
              <button>수락</button>
            </div>
          </div>
        </>
      )
    },
    {
      tabTitle: (
        <Nav.Link
          className={activeIndex === 1 ? classes.SelectedNavItem : classes.UnselectedNavItem}
          onClick={() => tabClickHandler(1)}
        >
          보낸 지원서
        </Nav.Link>
      ),
      tabCont: <div> {activeIndex} </div>
    }
  ];

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        팀 지원서
      </Button>
      <Modal show={show} onHide={handleClose}>
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

        <Modal.Footer></Modal.Footer>
      </Modal>
    </>
  );
};

export default TeamApplication;
