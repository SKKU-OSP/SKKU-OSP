import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from 'react-select';
import axios from 'axios';

import classes from './SignUpPage.module.css';

const option = [
  { value: 'g.skku.edu', label: 'g.skku.edu' },
  { value: 'skku.edu', label: 'skku.edu' },
  { value: 'gmail.com', label: 'gmail.com' },
  { value: 'naver.com', label: 'naver.com' },
  { value: 'kakao.com', label: 'kakao.com' },
  { value: 'nate.com', label: 'nate.com' },
  { value: 'yahoo.com', label: 'yahoo.com' }
];

const SignUpForm = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const tagListUrl = serverUrl + '/tag/api/list/';
  const SignUpFormUrl = serverUrl + '/accounts/signup/';
  const [tags, setTags] = useState([]);
  const [myTags, setMyTags] = useState([]);
  const [userNameText, setUserNameText] = useState('로그인에 사용할 아이디입니다.');
  // const [texts,setTexts] = useState
  const [inputValue, setInputValue] = useState({
    userName: '',
    password: '',
    rePassword: '',
    studentId: '',
    name: '',
    college: '',
    dept: '',
    absence: '',
    pluralMajor: '',
    personalEmail: '',
    personalEmailDomain: '',
    primaryEmail: '',
    secondaryEmail: '',
    secondaryEmailDomain: '',
    tag: ''
  });

  const {
    userName,
    password,
    rePassword,
    studentId,
    name,
    college,
    dept,
    absence,
    pluralMajor,
    personalEmail,
    personalEmailDomain,
    primaryEmail,
    secondaryEmail,
    secondaryEmailDomain,
    tag
  } = inputValue;

  const handleInput = (event) => {
    const { name, value } = event.target;
    setInputValue({
      ...inputValue,
      [name]: value
    });
    console.log(inputValue);
  };
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const getTags = async () => {
        const response = await axios.get(tagListUrl);
        const res = response.data;
        console.log(res);
        if (res.status === 'success') {
          setTags(
            res.data.tags.map((tag) => {
              return { value: tag.name, label: tag.name };
            })
          );
        } else {
        }
      };
      getTags();
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  // Tag 저장을 위한 함수
  const handleSelectTag = (selectTags) => {
    setMyTags(
      selectTags.map((tag) => {
        return tag.value;
      })
    );
  };

  //가입하기 버튼을 눌렀을 때 실행되는 함수
  const submitSignUpForm = (e) => {
    e.preventDefault();
    const data = { account_userName: userName, account_interests: myTags };
    const sendSignUpForm = async () => {
      try {
        const response = await axios.post(SignUpFormUrl, data);
        const res = response.data;
        if (res.status === 'fail') {
          console.log(res.feedback);
        } else {
          alert('회원가입에 성공했습니다.');
          navigate('/community');
        }
      } catch (error) {
        console.log(error);
      }
    };
    sendSignUpForm();
  };
  const checkUserName = () => {
    const data = inputValue.userName;
    if (data.length < 5) {
      setUserNameText('Username은 5자 이상이여야 합니다.');
    } else {
      setUserNameText('로그인에 사용할 아이디입니다.');
    }
  };

  return (
    <div className="d-flex container my-5 justify-content-center">
      <div className="col-lg-6 col-12 ">
        <div className="d-flex justify-content-center mb-3">
          <img src="/images/logo.svg" alt="Logo" className="w-25" />
        </div>
        <div className="my-3 fs-5">
          <span>SOSD에 와주셔서 감사합니다! GitHub 정보 외의 추가 정보를 입력하고 가입해주세요!</span>
        </div>
        <hr />

        {/* username */}
        <div className="d-flex flex-row justify-content-between mb-3">
          <div className={classes.FormControl}>
            <label htmlFor="github-id">
              GitHub Username<span className={classes.RequiredStar}>*</span>
            </label>
            <br />
            <Form.Label className={classes.WeakText}>GitHub 계정명으로 데이터 수집에 사용됩니다.</Form.Label>
            <InputGroup className="mb-3">
              <Form.Control placeholder="GitHubUserName" aria-label="GitHubUserName" disabled />
              <Button variant="outline-secondary" id="GitHubIdCheck" disabled>
                Check
              </Button>
            </InputGroup>
          </div>
          <div className={classes.FormControl}>
            <label htmlFor="github-id">
              Username <span className={classes.RequiredStar}>*</span>
            </label>
            <br />
            <Form.Label className={classes.WeakText}>{userNameText}</Form.Label>
            <InputGroup className="mb-3">
              <Form.Control
                placeholder="UserName"
                aria-label="UserName"
                id="userName"
                name="userName"
                onChange={handleInput}
              />
              <Button variant="outline-secondary" id="DuplicateCheck" onClick={checkUserName}>
                Check
              </Button>
            </InputGroup>
          </div>
        </div>

        {/* password */}
        <div className="d-flex flex-row justify-content-between mb-3">
          <div className={classes.FormControl}>
            <label htmlFor="password">
              Password<span className={classes.RequiredStar}>*</span>
            </label>
            <br />
            <Form.Label className={classes.WeakText}>비밀번호는 4자 이상이어야 합니다.</Form.Label>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                aria-label="Password"
                id="password"
                name="password"
                onChange={handleInput}
              />
            </Form.Group>
          </div>
          <div className={classes.FormControl}>
            <label htmlFor="PasswordCheck">
              Password Check <span className={classes.RequiredStar}>*</span>
            </label>
            <br />
            <Form.Label className={classes.WeakText}>비밀번호를 다시 입력해주세요.</Form.Label>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                aria-label="PasswordCheck"
                id="rePassword"
                name="rePassword"
                onChange={handleInput}
              />
            </Form.Group>
          </div>
        </div>

        {/* StudentId, Name */}
        <div className="d-flex flex-row justify-content-between mb-3">
          <div className={classes.FormControl}>
            <Form.Label htmlFor="StudentId">
              학번<span className={classes.RequiredStar}>*</span>
            </Form.Label>
            <InputGroup className="mb-3">
              <Form.Control
                placeholder="ex) 20XXXXXXXX"
                aria-label="StudentId"
                id="studentId"
                name="studentId"
                onChange={handleInput}
              />
              <Button variant="outline-secondary" id="StudentCheck">
                Check
              </Button>
            </InputGroup>
          </div>
          <div className={classes.FormControl}>
            <Form.Label htmlFor="Name">
              이름<span className={classes.RequiredStar}>*</span>
            </Form.Label>
            <InputGroup className="mb-3">
              <Form.Control placeholder="ex) 홍길동" aria-label="Name" name="name" onChange={handleInput} />
            </InputGroup>
          </div>
        </div>

        {/* 소속대학, 소속학과 */}
        <div className="d-flex flex-row justify-content-between mb-3">
          <div className={classes.FormControl}>
            <Form.Label htmlFor="College">
              소속 대학<span className={classes.RequiredStar}>*</span>
            </Form.Label>
            <Form.Select name="college" id="College">
              <option value="경영대학">경영대학</option>
              <option value="경제대학">경제대학</option>
              <option value="공과대학">공과대학</option>
              <option value="문과대학">문과대학</option>
              <option value="법과대학">법과대학</option>
              <option value="사범대학">사범대학</option>
              <option value="사회대학">사회과학대학</option>
              <option value="생명공학대학">생명공학대학</option>
              <option value="소프트웨어융합대학" selected>
                소프트웨어융합대학
              </option>
              <option value="스포츠과학대학">스포츠과학대학</option>
              <option value="약학대학">약학대학</option>
              <option value="예술대학">예술대학</option>
              <option value="유학대학">유학대학</option>
              <option value="의학대학">의학대학</option>
              <option value="자연과학대학">자연과학대학</option>
              <option value="정보통신대학">정보통신대학</option>
              <option value="학부대학">학부대학</option>
            </Form.Select>
          </div>
          <div className={classes.FormControl}>
            <Form.Label htmlFor="Dept">
              소속 학과<span className={classes.RequiredStar}>*</span>
            </Form.Label>
            <InputGroup className="mb-3">
              <Form.Control
                id="dept"
                name="dept"
                placeholder="ex) 소프트웨어학과"
                aria-label="Name"
                onChange={handleInput}
              />
            </InputGroup>
          </div>
        </div>

        {/* 재학여부, 복수전공 여부 */}
        <div className="d-flex flex-row justify-content-between mb-3">
          <div className={classes.FormControl}>
            <label htmlFor="AbsenceRadioOptions">
              재학 여부<span className={classes.RequiredStar}>*</span>
            </label>
            <div className="d-flex flex-row">
              <div className="d-flex flex-row">
                <Form.Check type="radio" name="absence" id="absenceFalse" value="0" className="me-2" checked />
                <Form.Label className="me-3">재학</Form.Label>
              </div>
              <div className="d-flex flex-row">
                <Form.Check type="radio" name="absence" id="absenceTrue" value="1" className="me-2" />
                <Form.Label className="me-3">휴학</Form.Label>
              </div>
              <div className="d-flex flex-row">
                <Form.Check type="radio" name="absence" id="absenceReal" value="2" className="me-2" />
                <Form.Label className="me-3">졸업</Form.Label>
              </div>
            </div>
          </div>
          <div className={classes.FormControl}>
            <label htmlFor="AbsenceRadioOptions">
              복수전공 여부<span className={classes.RequiredStar}>*</span>
            </label>
            <div className="d-flex flex-row">
              <div className="d-flex flex-row">
                <Form.Check type="radio" name="pluralMajor" id="pluralFalse" value="0" className="me-2" checked />
                <Form.Label className="me-3">원전공</Form.Label>
              </div>
              <div className="d-flex flex-row">
                <Form.Check type="radio" name="pluralMajor" id="pluralTrue" value="1" className="me-2" />
                <Form.Label className="me-3">복수전공</Form.Label>
              </div>
            </div>
          </div>
        </div>

        {/* email */}
        <div className="mb-3">
          <label htmlFor="PersonalEmail">
            Email <span className={classes.RequiredStar}>*</span>
          </label>
          <br />
          <Form.Label className={classes.WeakText}>계정정보를 찾을 때 사용합니다.</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control placeholder="연락용 Email" id="PersonalEmail" name="PersonalEmail" onChange={handleInput} />
            <InputGroup.Text>@</InputGroup.Text>
            <Form.Control
              placeholder="이메일 도메인"
              id="EmailDomain"
              name="PersonalEmailDomain"
              onChange={handleInput}
            />
            <Select
              options={option}
              menuPortalTarget={document.body}
              placeholder="직접입력"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </InputGroup>
        </div>

        {/* GithubEmail */}
        <div className="mb-3">
          <label htmlFor="PersonalEmail">
            GitHub Email <span className={classes.RequiredStar}>*</span>
          </label>
          <br />
          <Form.Label className={classes.WeakText}>GitHub Commit 기록을 추적하는데 사용합니다.</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control placeholder="깃헙 Email" id="PrimaryEmail" name="PrimaryEmail" disabled />
            <InputGroup.Text>@</InputGroup.Text>
            <Form.Control placeholder="이메일 도메인" id="PrimaryEmailDomain" name="PrimaryEmailDomain" disabled />
            <Select
              options={option}
              menuPortalTarget={document.body}
              placeholder="직접입력"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              isDisabled={true}
            />
          </InputGroup>
        </div>

        {/* ElseEmail */}
        <div className="mb-3">
          <label htmlFor="PersonalEmail">기타 연동 Email</label>
          <br />
          <Form.Label className={classes.WeakText}>
            로컬 Git 설정 이메일이 GitHub와 다른가요? 추가로 이메일을 연동할 수 있습니다.
          </Form.Label>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="기타 연동 Email"
              id="SecondaryEmail"
              name="SecondaryEmail"
              onChange={handleInput}
            />
            <InputGroup.Text>@</InputGroup.Text>
            <Form.Control
              placeholder="이메일 도메인"
              id="SecondaryEmailDomain"
              name="SecondaryEmailDomain"
              onChange={handleInput}
            />
            <Select
              options={option}
              menuPortalTarget={document.body}
              placeholder="직접입력"
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </InputGroup>
        </div>

        {/* 사용 언어 */}
        <div className="mb-3">
          <Form.Label htmlFor="personal-email">사용 언어/프레임워크</Form.Label>
          <Select size="sm" onChange={handleSelectTag} options={tags} placeholder="tag" isMulti></Select>
          {myTags.map((name) => {
            return <div>{name}</div>;
          })}
        </div>
        <br />
        {/* 버튼 */}
        <button id="consentSignUp" type="button" className="btn btn-secondary">
          개인정보 이용내역 동의 <span className={classes.RequiredStar}>*</span>
        </button>
        <div className="d-flex flex-row justify-content-end">
          <Button variant="primary" onClick={submitSignUpForm}>
            가입하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
