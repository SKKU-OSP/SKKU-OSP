import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom';

import classes from './TeamApplication.module.css';
import { ToggleButton } from 'react-bootstrap';

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
          <div className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0">
            <div className='d-flex'>
            <div className='me-2'> ChatGPT 개발자 되기 </div>
            <Link>bsstayo</Link>
            </div> 
            <div>
              <Button variant='outline-danger' size='sm' className='text-dark me-2'>거절</Button>
              <Button variant='outline-primary' size='sm' className='text-dark me-2'>수락</Button>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0">
            <div className='d-flex'>
            <div className='me-2'> ChatGPT 개발자 되기 </div>
            <Link>meltingOcean</Link>
            </div> 
            <div>
              <Button variant='outline-danger' size='sm' className='text-dark me-2'>거절</Button>
              <Button variant='outline-primary' size='sm' className='text-dark me-2'>수락</Button>
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
      tabCont: (
        <>
          <div className="d-flex justify-content-between align-items-center pt-2 pb-2 border border-start-0 border-end-0">
            <div> CREATE </div>
            
            <div>
                <Button variant='outline-primary' size='sm' className='text-dark me-2' checked={true}>승인됨</Button>
                <Button variant='outline-danger' size='sm' className='text-dark me-2'>삭제</Button>
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        팀 지원서
      </Button>
      <Modal size='lg' show={show} onHide={handleClose}>
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
