import { useEffect, useState } from 'react';
import axios from 'axios';
import LoaderIcon from 'react-loader-icon';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { BsGithub } from 'react-icons/bs';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';

import ConsentsModal from './ConsentsModal';
import classes from './SignUpForm.module.css';

const serverUrl = import.meta.env.VITE_SERVER_URL;
const client_id = import.meta.env.VITE_CLIENT_ID;

const SignUpForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { ssoData, githubCallbackData } = location.state || {};

  const [isGithubLinked, setIsGithubLinked] = useState(false);
  const [consents, setConsents] = useState([]);
  const [checkLoading, setCheckLoading] = useState({ username: false, submit: false });
  const [btnChecker, setBtnCheckr] = useState({ username: 'outline-secondary' });

  const [labels, setLabels] = useState({
    username: { label: '커뮤니티에서 사용할 닉네임입니다.', status: 'info' }
  });

  const [consentBtnClass, setConsentBtnClass] = useState('btn-secondary');
  const [selectAbsence, setSelectAbsence] = useState('0');
  const [selectPluralMajor, setSelectPluralMajor] = useState('0');
  const [selectConsent, setSelectConsent] = useState(false);
  const [selectConsentMandatory, setSelectConsentMandatory] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [consentRadios, setConsentRadios] = useState({ open_lvl: 0, is_write: 0, is_open: 0 });

  const [formData, setFormData] = useState({
    username: '',
    github_id: '',
    student_id: ssoData?.student_id || '',
    name: ssoData?.name || '',
    college: ssoData?.college || '',
    dept: ssoData?.dept || '',
    absence: '0',
    plural_major: '0',
    primary_email: '',
    primary_email_domain: '',
    consent: false,
    consent_mandatory: false
  });

  useEffect(() => {
    if (!ssoData) {
      alert('SSO 로그인을 통해 가입해주세요.');
      navigate('/accounts/login');
      return;
    }
    const signUpFormUrl = serverUrl + '/accounts/signup/';
    axios.get(signUpFormUrl).then((response) => {
      const res = response.data;
      if (res.status === 'success') {
        setConsents(res.data.consents);
      }
    });
  }, [ssoData, navigate]);

  useEffect(() => {
    if (githubCallbackData) {
      const [emailId, emailDomain] = (githubCallbackData.github_email || '').split('@');
      setFormData((prev) => ({
        ...prev,
        github_id: githubCallbackData.github_username,
        primary_email: emailId,
        primary_email_domain: emailDomain
      }));
      setIsGithubLinked(true);
    }
  }, [githubCallbackData]);

  const handleGithubLink = () => {
    const state = JSON.stringify({ ssoData: ssoData, isConnecting: true });
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${client_id}&state=${encodeURIComponent(state)}&scope=user:email`;
  };

  const onChangeUsername = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length < 2) {
      setLabels((prev) => ({
        ...prev,
        username: { label: '닉네임은 2자 이상이어야 합니다.', status: 'error' }
      }));
    } else {
      setLabels((prev) => ({
        ...prev,
        username: { label: '커뮤니티에서 사용할 닉네임입니다.', status: 'info' }
      }));
    }
  };

  const CheckUsername = async () => {
    setCheckLoading({ ...checkLoading, username: true });
    const response = await axios.post(serverUrl + '/accounts/register/checkuser/', {
      username: formData.username
    });
    const res = response.data;
    setCheckLoading({ ...checkLoading, username: false });
    alert(res.message);
    const btnStatusMap = { success: 'primary', fail: 'danger' };
    setBtnCheckr((prev) => ({ ...prev, username: btnStatusMap[res.status] }));
  };

  const handleAbsence = (e) => setFormData((prev) => ({ ...prev, absence: e.target.value }));
  const handlePluralMajor = (e) => setFormData((prev) => ({ ...prev, plural_major: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCheckLoading({ ...checkLoading, submit: true });

    const finalFormData = {
      ...formData,
      absence: selectAbsence,
      plural_major: selectPluralMajor,
      consent: selectConsent,
      consent_mandatory: selectConsentMandatory
    };

    try {
      const response = await axios.post(serverUrl + '/accounts/signup/', finalFormData);
      const res = response.data;
      if (res.status === 'fail') {
        alert(res.message || '회원가입에 실패했습니다.');
        console.log('Validation Errors:', res.feedback);
      } else {
        alert('회원가입에 성공했습니다.');
        navigate('/community');
      }
    } catch (error) {
      console.error(error);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setCheckLoading({ ...checkLoading, submit: false });
    }
  };

  const labelClass = {
    info: classes.WeakText,
    error: classes.ErrorText,
    success: classes.SuccessText
  };

  return (
    <Form onSubmit={handleSubmit} method="post">
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-25" />
      </div>
      <div className="my-3 fs-5">
        <span>환영합니다! SSO 인증이 완료되었습니다.</span>
        <br />
        <span>서비스 이용을 위해 닉네임을 설정하고 GitHub 계정을 연동해주세요.</span>
      </div>
      <hr />

      {/* Username */}
      <div className={classes.FormControl}>
        <label htmlFor="username">
          닉네임 <span className={classes.RequiredStar}>*</span>
        </label>
        <br />
        <Form.Label className={labelClass[labels.username.status]}>{labels.username.label}</Form.Label>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="닉네임"
            aria-label="Username"
            id="username"
            name="username"
            onChange={onChangeUsername}
            autoComplete="username"
          />
          <Button variant={btnChecker.username} onClick={CheckUsername} disabled={checkLoading.username}>
            {checkLoading.username ? <LoaderIcon type={'spin'} size={16} /> : '중복확인'}
          </Button>
        </InputGroup>
      </div>

      {/* StudentId, Name */}
      <div className="d-flex flex-row justify-content-between mb-3">
        <div className={classes.FormControl}>
          <Form.Label htmlFor="student_id">학번</Form.Label>
          <InputGroup>
            <Form.Control id="student_id" value={formData.student_id} disabled />
          </InputGroup>
        </div>
        <div className={classes.FormControl}>
          <Form.Label htmlFor="name">이름</Form.Label>
          <InputGroup>
            <Form.Control id="name" value={formData.name} disabled />
          </InputGroup>
        </div>
      </div>

      {/* 소속대학, 소속학과 */}
      <div className="d-flex flex-row justify-content-between mb-3">
        <div className={classes.FormControl}>
          <Form.Label htmlFor="college">소속 대학</Form.Label>
          <InputGroup>
            <Form.Control id="college" value={formData.college} disabled />
          </InputGroup>
        </div>
        <div className={classes.FormControl}>
          <Form.Label htmlFor="dept">소속 학과</Form.Label>
          <InputGroup>
            <Form.Control id="dept" value={formData.dept} disabled />
          </InputGroup>
        </div>
      </div>

      {/* 재학여부, 복수전공 여부 */}
      <div className="d-flex flex-row justify-content-between mb-3">
        <div className={classes.FormControl}>
          <label>재학 여부<span className={classes.RequiredStar}>*</span></label>
          <div className="d-flex flex-row">
            <Form.Check type="radio" name="absence" id="absenceFalse" value="0" className="me-2" onChange={handleAbsence} defaultChecked />
            <Form.Label htmlFor="absenceFalse" className="me-3">재학</Form.Label>
            <Form.Check type="radio" name="absence" id="absenceTrue" value="1" className="me-2" onChange={handleAbsence} />
            <Form.Label htmlFor="absenceTrue" className="me-3">휴학</Form.Label>
            <Form.Check type="radio" name="absence" id="absenceReal" value="2" className="me-2" onChange={handleAbsence} />
            <Form.Label htmlFor="absenceReal" className="me-3">졸업</Form.Label>
          </div>
        </div>
        <div className={classes.FormControl}>
          <label>복수전공 여부<span className={classes.RequiredStar}>*</span></label>
          <div className="d-flex flex-row">
            <Form.Check type="radio" name="plural_major" id="pluralFalse" value="0" className="me-2" onChange={handlePluralMajor} defaultChecked />
            <Form.Label htmlFor="pluralFalse" className="me-3">원전공</Form.Label>
            <Form.Check type="radio" name="plural_major" id="pluralTrue" value="1" className="me-2" onChange={handlePluralMajor} />
            <Form.Label htmlFor="pluralTrue" className="me-3">복수전공</Form.Label>
          </div>
        </div>
      </div>

      <hr />
      <h5 className="mb-3">GitHub 연동<span className={classes.RequiredStar}>*</span></h5>

      {!isGithubLinked ? (
        <div className="d-grid">
          <Button variant="dark" onClick={handleGithubLink}>
            <BsGithub /> GitHub 계정 연동하기
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label>GitHub Username</label>
            <InputGroup>
              <Form.Control value={formData.github_id} disabled />
            </InputGroup>
          </div>
          <div className="mb-3">
            <label>GitHub Email</label>
            <InputGroup>
              <Form.Control value={formData.primary_email} disabled />
              <InputGroup.Text>@</InputGroup.Text>
              <Form.Control value={formData.primary_email_domain} disabled />
            </InputGroup>
          </div>
        </>
      )}

      <br />

      <Button
        onClick={() => { setOpenModal(true); setSelectConsent(true); setConsentBtnClass('btn-danger'); }}
        type="button"
        className={`pulsing-button btn ms-auto mb-1 ${consentBtnClass}`}
      >
        개인정보 이용내역 동의<span className={classes.RequiredStar}>*</span>
      </Button>

      {openModal && (
        <ConsentsModal
          consents={consents}
          show={openModal}
          changeModal={setOpenModal}
          radioValue={consentRadios}
          changeRadioValue={setConsentRadios}
          changeMandatoryValue={setSelectConsentMandatory}
          changeConsentBtn={setConsentBtnClass}
        />
      )}
      <div className="d-flex flex-row justify-content-end">
        <Button
          variant="primary"
          type="submit"
          disabled={!isGithubLinked || checkLoading.submit}
          style={{ background: '#072a60', borderColor: '#072a60' }}
        >
          {checkLoading.submit ? <LoaderIcon type={'spin'} size={24} /> : '가입하기'}
        </Button>
      </div>
    </Form>
  );
};

export default SignUpForm;
