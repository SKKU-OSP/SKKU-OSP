import { useEffect, useState } from 'react';

import axios from 'axios';
import Select from 'react-select';
import LoaderIcon from 'react-loader-icon';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';

import ConsentsModal from './ConsentsModal';
import classes from './SignUpForm.module.css';

const serverUrl = import.meta.env.VITE_SERVER_URL;

const SignUpForm = () => {
  const kingoCoinKey = import.meta.env.VITE_KINGOCOIN_KEY;

  const location = useLocation();
  const githubData = location.state;

  //AXIOS GET
  const [domains, setDomains] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [consents, setConsents] = useState([]);
  const [tags, setTags] = useState([]);
  //INPUT

  const [labels, setLabels] = useState({
    username: { label: '로그인에 사용할 아이디입니다.', status: 'info' },
    password: { label: '비밀번호는 4자 이상이어야 합니다.', status: 'info' },
    checkPassword: { label: '비밀번호를 다시 입력해주세요.', status: 'info' },
    student_id: { label: '', status: 'info' },
    name: { label: '', status: 'info' },
    college: { label: '', status: 'info' },
    dept: { label: '', status: 'info' },
    personal_email: { label: '계정정보를 찾을 때 사용합니다.', status: 'info' },
    primary_email: { label: 'GitHub Commit 기록을 추적하는데 사용합니다.', status: 'info' },
    secondary_email: {
      label: '로컬 Git 설정 이메일이 GitHub와 다른가요? 추가로 이메일을 연동할 수 있습니다.',
      status: 'info'
    }
  });

  const [btnChecker, setBtnCheckr] = useState({
    github_id: 'outline-secondary',
    username: 'outline-secondary',
    student_id: 'outline-secondary'
  });
  const [checkLoading, setCheckLoading] = useState({
    github_id: false,
    username: false,
    student_id: false,
    submit: false
  });

  const [consentBtnClass, setConsentBtnClass] = useState('btn-secondary');
  const [selectCollege, setSelectCollege] = useState('');
  const [selectAbsence, setSelectAbsence] = useState('0');
  const [selectPluralMajor, setSelectPluralMajor] = useState('0');
  const [personalDomain, setPersonalDomain] = useState('');
  const [inputPersonalDomain, setInputPersonalDomain] = useState('');
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [inputPrimaryDomain, setInputPrimaryDomain] = useState(githubData?.github_email_domain.value);
  const [secondaryDomain, setSecondaryDomain] = useState('');
  const [inputSecondaryDomain, setInputSecondaryDomain] = useState('');
  const [selectConsent, setSelectConsent] = useState(false);
  const [selectConsentMandatory, setSelectConsentMandatory] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [consentRadios, setConsentRadios] = useState({
    open_lvl: 0,
    is_write: 0,
    is_open: 0
  });

  const [selectTags, setSelectTags] = useState([]);
  const [formData, setFormData] = useState({
    github_id: githubData?.github_username.value,
    username: githubData?.username.value,
    password: '',
    password_check: '',
    student_id: 0,
    name: '',
    college: '',
    dept: '',
    absence: 0,
    plural_major: 0,
    personal_email: '',
    personal_email_domain: '',
    primary_email: githubData?.github_email_id.value,
    primary_email_domain: githubData?.github_email_domain.value,
    secondary_email: '',
    secondary_email_domain: '',
    account_interests: '',
    consent: false,
    consent_mandatory: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    try {
      const signUpFormUrl = serverUrl + '/accounts/signup/';

      const getData = async () => {
        const response = await axios.get(signUpFormUrl);
        const res = response.data;
        if (res.status === 'success') {
          setTags(
            res.data.tags.map((tag) => {
              return { value: tag.name, label: tag.name };
            })
          );
          setColleges(
            res.data.colleges.map((collegeName) => {
              return { value: collegeName, label: collegeName };
            })
          );
          const emailDomains = res.data.email_domains.map((domainName) => {
            return { value: domainName, label: domainName };
          });
          emailDomains.push({ value: '', label: '직접 입력' });
          setDomains(emailDomains);
          setConsents(res.data.consents);

          ReactGA.event({
            category: 'Sign_Up',
            action: 'Access Sign_Up',
            label: '회원가입 페이지 접근'
          });
        } else {
          console.log(res.message);
        }
      };
      if (githubData) {
        getData();
      } else {
        alert('GitHub 로그인을 통해 가입해주세요');
        navigate('/accounts/login');
      }
    } catch (error) {
      console.log('error', error);
    }
  }, [githubData, navigate]);

  // Tag 저장을 위한 함수
  const handleSelectTag = (selectTags) => {
    setSelectTags(selectTags.map((tag) => tag.value));
  };

  const handleSelectCollege = (obj) => {
    onChangeCollege();
    setSelectCollege(obj.value);
    setFormData((prev) => {
      return { ...prev, college: obj.value };
    });
  };

  const handleSelectPersonalDomain = (obj) => {
    setPersonalDomain(obj.value);
    setInputPersonalDomain(obj.value);
    setFormData((prev) => {
      return { ...prev, personal_email_domain: obj.value };
    });
  };
  const handleSelectPrimaryDomain = (obj) => {
    setPrimaryDomain(obj.value);
    setInputPrimaryDomain(obj.value);
    setFormData((prev) => {
      return { ...prev, primary_email_domain: obj.value };
    });
  };

  const handleSelectSecondaryDomain = (obj) => {
    setSecondaryDomain(obj.value);
    setInputSecondaryDomain(obj.value);
    setFormData((prev) => {
      return { ...prev, secondary_email_domain: obj.value };
    });
  };

  const handleAbsence = (e) => {
    setSelectAbsence(e.target.value);
    setFormData((prev) => {
      return { ...prev, absence: e.target.value };
    });
  };

  const handlePluralMajor = (e) => {
    setSelectPluralMajor(e.target.value);
    setFormData((prev) => {
      return { ...prev, plural_major: e.target.value };
    });
  };

  const sendSignUpForm = async () => {
    try {
      setCheckLoading({ ...checkLoading, submit: true });
      const signUpFormUrl = serverUrl + '/accounts/signup/';
      const response = await axios.post(signUpFormUrl, formData);
      const res = response.data;
      setCheckLoading({ ...checkLoading, submit: false });
      if (res.status === 'fail') {
        //feedback을 통해 에러정보 들어옴
        console.log(res.feedback);
        if (res.feedback.username) {
          setLabels((prev) => {
            return { ...prev, username: { label: res.feedback.username, status: 'error' } };
          });
        }
        if (res.feedback.password) {
          setLabels((prev) => {
            return { ...prev, password: { label: res.feedback.password, status: 'error' } };
          });
        }
        if (res.feedback.student_id) {
          setLabels((prev) => {
            return { ...prev, student_id: { label: res.feedback.student_id, status: 'error' } };
          });
        }
        if (res.feedback.name) {
          setLabels((prev) => {
            return { ...prev, name: { label: res.feedback.name, status: 'error' } };
          });
        }
        if (res.feedback.dept) {
          setLabels((prev) => {
            return { ...prev, dept: { label: res.feedback.dept, status: 'error' } };
          });
        } else {
          setLabels((prev) => {
            return { ...prev, dept: { label: '', status: 'info' } };
          });
        }
        if (res.feedback.college) {
          setLabels((prev) => {
            return { ...prev, college: { label: res.feedback.college, status: 'error' } };
          });
        } else {
          setLabels((prev) => {
            return { ...prev, college: { label: '', status: 'info' } };
          });
        }
        if (res.feedback.personal_email) {
          setLabels((prev) => {
            return { ...prev, personal_email: { label: res.feedback.personal_email, status: 'error' } };
          });
        } else {
          setLabels((prev) => {
            return { ...prev, personal_email: { label: '계정정보를 찾을 때 사용합니다.', status: 'info' } };
          });
        }
        if (res.feedback.primary_email) {
          setLabels((prev) => {
            return { ...prev, primary_email: { label: res.feedback.primary_email, status: 'error' } };
          });
        } else {
          setLabels((prev) => {
            return { ...prev, primary_email: { label: 'GitHub Commit 기록을 추적하는데 사용합니다.', status: 'info' } };
          });
        }
        if (res.feedback.secondary_email) {
          setLabels((prev) => {
            return { ...prev, secondary_email: { label: res.feedback.secondary_email, status: 'error' } };
          });
        } else {
          setLabels((prev) => {
            return {
              ...prev,
              secondary_email: {
                label: '로컬 Git 설정 이메일이 GitHub와 다른가요? 추가로 이메일을 연동할 수 있습니다.',
                status: 'info'
              }
            };
          });
        }
        if (res.feedback.consent) {
          alert(res.feedback.consent);
          setConsentBtnClass('btn-danger');
        }
      } else {
        alert('회원가입에 성공했습니다.');
        try {
          await axios.post('https://kingocoin.cs.skku.edu/api/coin/point/auto', {
            stId: formData.student_id,
            stName: formData.name,
            key: kingoCoinKey,
            plId: 7,
            plus: true
          });
        } catch (error) {
          console.log(error);
        }
        ReactGA.event({
          category: 'Sign_Up',
          action: 'Success_Sign_UP',
          label: '로그인 성공'
        });
        navigate('/community');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleInputPersonalDomain = (e) => {
    if (personalDomain === '') {
      setInputPersonalDomain(e.target.value);
      setFormData((prev) => {
        return { ...prev, personal_email_domain: e.target.value };
      });
    } else {
      setInputPersonalDomain(personalDomain);
      setFormData((prev) => {
        return { ...prev, personal_email_domain: personalDomain };
      });
    }
  };
  const handleInputPrimaryDomain = (e) => {
    if (primaryDomain === '') {
      setInputPrimaryDomain(e.target.value);
      setFormData((prev) => {
        return { ...prev, primary_email_domain: e.target.value };
      });
    } else {
      setInputPrimaryDomain(primaryDomain);
      setFormData((prev) => {
        return { ...prev, primary_email_domain: primaryDomain };
      });
    }
  };
  const handleInputSecondaryDomain = (e) => {
    if (secondaryDomain === '') {
      setInputSecondaryDomain(e.target.value);
      setFormData((prev) => {
        return { ...prev, secondary_email_domain: e.target.value };
      });
    } else {
      setInputSecondaryDomain(secondaryDomain);
      setFormData((prev) => {
        return { ...prev, secondary_email_domain: secondaryDomain };
      });
    }
  };
  //유효성검사
  //가입하기 버튼을 눌렀을 때 실행되는 함수
  const onChangeUsername = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length < 5) {
      setLabels((prev) => {
        return { ...prev, username: { label: 'Username은 5자 이상이여야 합니다.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, username: { label: '로그인에 사용할 아이디입니다.', status: 'info' } };
      });
    }
  };

  const onChangePassword = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length < 4) {
      setLabels((prev) => {
        return { ...prev, password: { label: '비밀번호는 4자 이상이어야 합니다.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, password: { label: '알맞은 형식의 비밀번호입니다.', status: 'info' } };
      });
    }
  };

  const onChangeCheckPassword = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value === formData['password']) {
      setLabels((prev) => {
        return { ...prev, checkPassword: { label: '비밀번호와 일치합니다.', status: 'info' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, checkPassword: { label: 'password가 일치하지 않습니다.', status: 'error' } };
      });
    }
  };

  const onChangeStudentId = (e) => {
    const { name, value } = e.target;
    const regex = /^[0-9]{10}$/;
    setFormData({ ...formData, [name]: value });
    if (!regex.test(e.target.value)) {
      setLabels((prev) => {
        return { ...prev, student_id: { label: '학번 형식이 다릅니다.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, student_id: { label: '알맞은 학번 형식입니다.', status: 'success' } };
      });
    }
  };

  const onChangeName = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length > 20) {
      setLabels((prev) => {
        return { ...prev, name: { label: '이름은 20자를 넘을 수 없습니다.', status: 'error' } };
      });
    } else if (value.length < 1) {
      setLabels((prev) => {
        return { ...prev, name: { label: '이름을 입력해주세요.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, name: { label: '', status: 'success' } };
      });
    }
  };

  const onChangeCollege = () => {
    setLabels((prev) => {
      return { ...prev, college: { label: '', status: 'info' } };
    });
  };

  const onChangeDept = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length > 45) {
      setLabels((prev) => {
        return { ...prev, dept: { label: '학과는 45자를 넘을 수 없습니다.', status: 'error' } };
      });
    } else if (value.length < 1) {
      setLabels((prev) => {
        return { ...prev, dept: { label: '학과를 입력해주세요.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, dept: { label: '', status: 'info' } };
      });
    }
  };

  const onChangePersonalEmail = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length > 100) {
      setLabels((prev) => {
        return { ...prev, personal_email: { label: '이메일 주소는 100자를 넘을 수 없습니다.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return { ...prev, personal_email: { label: '계정정보를 찾을 때 사용합니다.', status: 'info' } };
      });
    }
  };

  const onChangePrimaryEmail = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length > 100) {
      setLabels((prev) => {
        return { ...prev, primary_email: { label: '이메일 주소는 100자를 넘을 수 없습니다.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return {
          ...prev,
          primary_email: { label: 'GitHub Commit 기록을 추적하는데 사용합니다.', status: 'info' }
        };
      });
    }
  };

  const onChangeSecondaryEmail = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.length > 100) {
      setLabels((prev) => {
        return { ...prev, secondary_email: { label: '이메일 주소는 100자를 넘을 수 없습니다.', status: 'error' } };
      });
    } else {
      setLabels((prev) => {
        return {
          ...prev,
          secondary_email: {
            label: '로컬 Git 설정 이메일이 GitHub와 다른가요? 추가로 이메일을 연동할 수 있습니다.',
            status: 'info'
          }
        };
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData((prev) => {
      const newData = prev;
      newData['github_id'] = formData.github_id;
      newData['college'] = selectCollege;
      newData['absence'] = selectAbsence;
      newData['plural_major'] = selectPluralMajor;
      newData['account_interests'] = selectTags;
      newData['primary_email'] = formData.primary_email;
      newData['primary_email_domain'] = formData.primary_email_domain;
      newData['consent'] = selectConsent;
      newData['consent_mandatory'] = selectConsentMandatory;
      return newData;
    });
    sendSignUpForm();
  };

  const labelClass = {
    info: classes.WeakText,
    error: classes.ErrorText,
    success: classes.SuccessText
  };
  const btnStatusMap = {
    success: 'primary',
    fail: 'danger'
  };

  // GitHub Username 검사 로직 삭제
  // 받아오는 GitAuth 에서 받아오는 github username이 항상 유효한지 확인 필요함
  // const CheckGithubId = async () => {
  //   setCheckLoading({ ...checkLoading, github_id: true });
  //   const response = await axios.post(serverUrl + '/accounts/register/checkgithub/', {
  //     github_id: githubData?.github_username.value
  //   });
  //   const res = response.data;
  //   setCheckLoading({ ...checkLoading, github_id: false });
  //   alert(res.message);
  //   setBtnCheckr((prev) => {
  //     return { ...prev, github_id: btnStatusMap[res.status] };
  //   });
  // };
  const CheckStudent = async () => {
    setCheckLoading({ ...checkLoading, student_id: true });
    const response = await axios.post(serverUrl + '/accounts/register/checkstudent/', {
      student_id: formData.student_id
    });
    const res = response.data;
    setCheckLoading({ ...checkLoading, student_id: false });
    alert(res.message);
    setBtnCheckr((prev) => {
      return { ...prev, student_id: btnStatusMap[res.status] };
    });
  };
  const CheckUsername = async () => {
    setCheckLoading({ ...checkLoading, username: true });
    const response = await axios.post(serverUrl + '/accounts/register/checkuser/', {
      username: formData.username
    });
    const res = response.data;
    setCheckLoading({ ...checkLoading, username: false });
    alert(res.message);
    setBtnCheckr((prev) => {
      return { ...prev, username: btnStatusMap[res.status] };
    });
  };

  return (
    <Form onSubmit={handleSubmit} method="post">
      <div className="d-flex justify-content-center mb-3">
        <img src="/images/logo.svg" alt="Logo" className="w-25" />
      </div>
      <div className="my-3 fs-5">
        <span>환영합니다! GitHub 정보 수집을 위해 다음 정보를 입력해주세요.</span>
      </div>
      <hr />

      {/* username */}
      <div className="d-flex flex-row justify-content-between mb-3">
        <div className={classes.FormControl}>
          <label htmlFor="github_id">
            GitHub Username<span className={classes.RequiredStar}>*</span>
          </label>
          <br />
          <Form.Label className={classes.WeakText}>GitHub 계정명으로 데이터 수집에 사용됩니다.</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control
              id="github_id"
              placeholder="GitHub Username"
              aria-label="GitHub Username"
              defaultValue={githubData?.github_username.value}
              disabled={githubData?.github_username.readonly}
            />
          </InputGroup>
        </div>
        <div className={classes.FormControl}>
          <label htmlFor="username">
            Username <span className={classes.RequiredStar}>*</span>
          </label>
          <br />
          <Form.Label className={labelClass[labels.username.status]}>{labels.username.label}</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Username"
              aria-label="Username"
              id="username"
              name="username"
              defaultValue={githubData?.username.value}
              disabled={githubData?.username.readonly}
              onChange={onChangeUsername}
              autoComplete="username"
            />
            <Button variant={btnChecker.username} onClick={CheckUsername} disabled={checkLoading.username}>
              {checkLoading.username ? <LoaderIcon type={'spin'} size={16} className={classes.btnLoader} /> : 'Check'}
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
          <Form.Label className={labelClass[labels.password.status]}>{labels.password.label}</Form.Label>
          <Form.Group className="mb-3">
            <Form.Control
              type="password"
              placeholder="Password"
              aria-label="Password"
              id="password"
              name="password"
              onChange={onChangePassword}
              autoComplete="new-password"
            />
          </Form.Group>
        </div>
        <div className={classes.FormControl}>
          <label htmlFor="PasswordCheck">
            Password Check <span className={classes.RequiredStar}>*</span>
          </label>
          <br />
          <Form.Label className={labelClass[labels.checkPassword.status]}>{labels.checkPassword.label}</Form.Label>
          <Form.Group className="mb-3">
            <Form.Control
              type="password"
              placeholder="Password"
              aria-label="PasswordCheck"
              id="password_check"
              name="password_check"
              onChange={onChangeCheckPassword}
              autoComplete="new-password"
            />
          </Form.Group>
        </div>
      </div>

      {/* StudentId, Name */}
      <div className="d-flex flex-row justify-content-between mb-3">
        <div className={classes.FormControl}>
          <Form.Label htmlFor="student_id" className="me-2">
            학번<span className={classes.RequiredStar}>*</span>
          </Form.Label>
          <Form.Label className={labelClass[labels.student_id.status]}>{labels.student_id.label}</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="ex) 20XXXXXXXX"
              aria-label="student_id"
              id="student_id"
              name="student_id"
              onChange={onChangeStudentId}
            />
            <Button variant={btnChecker.student_id} onClick={CheckStudent} disabled={checkLoading.student_id}>
              {checkLoading.student_id ? <LoaderIcon type={'spin'} size={16} className={classes.btnLoader} /> : 'Check'}
            </Button>
          </InputGroup>
        </div>
        <div className={classes.FormControl}>
          <Form.Label htmlFor="name" className="me-2">
            이름<span className={classes.RequiredStar}>*</span>
          </Form.Label>
          <Form.Label className={labelClass[labels.name.status]}>{labels.name.label}</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control placeholder="ex) 홍길동" aria-label="name" id="name" name="name" onChange={onChangeName} />
          </InputGroup>
        </div>
      </div>
      {/* 소속대학, 소속학과 */}
      <div className="d-flex flex-row justify-content-between mb-3">
        <div className={classes.FormControl}>
          <Form.Label htmlFor="college">
            소속 대학<span className={classes.RequiredStar}>*</span>
          </Form.Label>
          <Form.Label className={labelClass[labels.college.status]}>{labels.college.label}</Form.Label>
          <Select size="sm" options={colleges} id="college" name="college" onChange={handleSelectCollege} />
        </div>
        <div className={classes.FormControl}>
          <Form.Label htmlFor="dept" className="me-1">
            소속 학과<span className={classes.RequiredStar}>*</span>
          </Form.Label>
          <Form.Label className={labelClass[labels.dept.status]}>{labels.dept.label}</Form.Label>
          <InputGroup className="mb-3">
            <Form.Control
              id="dept"
              name="dept"
              placeholder="ex) 소프트웨어학과"
              aria-label="dept"
              onChange={onChangeDept}
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
              <Form.Check
                type="radio"
                name="absence"
                id="absenceFalse"
                value="0"
                className="me-2"
                onChange={handleAbsence}
                defaultChecked
              />
              <Form.Label htmlFor="absenceFalse" className="me-3">
                재학
              </Form.Label>
            </div>
            <div className="d-flex flex-row">
              <Form.Check
                type="radio"
                name="absence"
                id="absenceTrue"
                value="1"
                className="me-2"
                onChange={handleAbsence}
              />
              <Form.Label htmlFor="absenceTrue" className="me-3">
                휴학
              </Form.Label>
            </div>
            <div className="d-flex flex-row">
              <Form.Check
                type="radio"
                name="absence"
                id="absenceReal"
                value="2"
                className="me-2"
                onChange={handleAbsence}
              />
              <Form.Label htmlFor="absenceReal" className="me-3">
                졸업
              </Form.Label>
            </div>
          </div>
        </div>
        <div className={classes.FormControl}>
          <label htmlFor="AbsenceRadioOptions">
            복수전공 여부<span className={classes.RequiredStar}>*</span>
          </label>
          <div className="d-flex flex-row">
            <div className="d-flex flex-row">
              <Form.Check
                type="radio"
                name="plural_major"
                id="pluralFalse"
                value="0"
                className="me-2"
                onChange={handlePluralMajor}
                defaultChecked
              />
              <Form.Label htmlFor="pluralFalse" className="me-3">
                원전공
              </Form.Label>
            </div>
            <div className="d-flex flex-row">
              <Form.Check
                type="radio"
                name="plural_major"
                id="pluralTrue"
                value="1"
                className="me-2"
                onChange={handlePluralMajor}
              />
              <Form.Label htmlFor="pluralTrue" className="me-3">
                복수전공
              </Form.Label>
            </div>
          </div>
        </div>
      </div>

      {/* email */}
      <div className="mb-3">
        <label htmlFor="personal_email">
          Email <span className={classes.RequiredStar}>*</span>
        </label>
        <br />
        <Form.Label className={labelClass[labels.personal_email.status]}>{labels.personal_email.label}</Form.Label>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="연락용 Email"
            id="personal_email"
            name="personal_email"
            onChange={onChangePersonalEmail}
            defaultValue={githubData?.personal_email_id.value}
            disabled={githubData?.personal_email_id.readonly}
          />
          <InputGroup.Text>@</InputGroup.Text>
          <Form.Control
            placeholder="이메일 도메인"
            id="email_domain"
            name="personal_email_domain"
            onChange={handleInputPersonalDomain}
            value={inputPersonalDomain}
            disabled={githubData?.personal_email_domain.readonly}
          />
          <Select
            options={domains}
            placeholder="직접입력"
            onChange={handleSelectPersonalDomain}
            isDisabled={githubData?.personal_email_domain.readonly}
          />
        </InputGroup>
      </div>

      {/* GithubEmail */}
      <div className="mb-3">
        <label htmlFor="primary_email">
          GitHub Email <span className={classes.RequiredStar}>*</span>
        </label>
        <br />
        <Form.Label className={labelClass[labels.primary_email.status]}>{labels.primary_email.label}</Form.Label>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="깃헙 Email"
            id="primary_email"
            name="primary_email"
            onChange={onChangePrimaryEmail}
            defaultValue={githubData?.github_email_id.value}
            disabled={githubData?.github_email_id.readonly}
          />
          <InputGroup.Text>@</InputGroup.Text>
          <Form.Control
            placeholder="이메일 도메인"
            id="primary_email_domain"
            name="primary_email_domain"
            onChange={handleInputPrimaryDomain}
            value={inputPrimaryDomain}
            disabled={githubData?.github_email_domain.readonly}
          />
          <Select
            options={domains}
            placeholder="직접입력"
            onChange={handleSelectPrimaryDomain}
            isDisabled={githubData?.github_email_domain.readonly}
          />
        </InputGroup>
      </div>

      {/* ElseEmail */}
      <div className="mb-3">
        <label htmlFor="secondary_email">기타 연동 Email</label>
        <br />
        <Form.Label className={labelClass[labels.secondary_email.status]}>{labels.secondary_email.label}</Form.Label>
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="기타 연동 Email"
            id="secondary_email"
            name="secondary_email"
            onChange={onChangeSecondaryEmail}
          />
          <InputGroup.Text>@</InputGroup.Text>
          <Form.Control
            placeholder="이메일 도메인"
            id="secondary_email_domain"
            name="secondary_email_domain"
            value={inputSecondaryDomain}
            onChange={handleInputSecondaryDomain}
          />
          <Select options={domains} placeholder="직접입력" onChange={handleSelectSecondaryDomain} />
        </InputGroup>
      </div>

      {/* 사용 언어 */}
      {/* <div className="mb-3">
        <Form.Label htmlFor="tag">사용 언어/프레임워크</Form.Label>
        <Select
          size="sm"
          onChange={handleSelectTag}
          options={tags}
          placeholder="tag"
          id="tag"
          name="tag"
          isMulti
        ></Select>
      </div> */}
      <br />
      {/* 버튼 */}

      {/* 개인정보 이용내역 동의 */}
      <Button
        onClick={() => {
          setOpenModal(!openModal);
          setSelectConsent(true);
          setConsentBtnClass('btn-danger');
        }}
        type="button"
        className={`pulsing-button btn ms-auto mb-1 ${consentBtnClass}`}
      >
        개인정보 이용내역 동의<span className={classes.RequiredStar}>*</span>
      </Button>

      {openModal === true ? (
        <ConsentsModal
          consents={consents}
          show={openModal}
          changeModal={setOpenModal}
          radioValue={consentRadios}
          changeRadioValue={setConsentRadios}
          changeMandatoryValue={setSelectConsentMandatory}
          changeConsentBtn={setConsentBtnClass}
        />
      ) : null}
      <div className="d-flex flex-row justify-content-end">
        <Button
          variant="primary"
          type="submit"
          disabled={checkLoading.submit}
          style={{ background: '#072a60', borderColor: '#072a60' }}
        >
          {checkLoading.submit ? <LoaderIcon type={'spin'} size={24} className={classes.btnLoader} /> : '가입하기'}
        </Button>
      </div>
    </Form>
  );
};

export default SignUpForm;
