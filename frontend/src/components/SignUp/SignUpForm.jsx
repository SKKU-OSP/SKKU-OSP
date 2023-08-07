import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Select from 'react-select';
import axios from 'axios';

import ConsentsModal from './ConsentsModal';
import classes from './SignUpForm.module.css';

const SignUpForm = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL;
  const signUpFormUrl = serverUrl + '/accounts/signup/';
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
  console.log(labels);
  const [clicked, setClicked] = useState(false);

  const [selectCollege, setSelectCollege] = useState('');
  const [selectAbsence, setSelectAbsence] = useState('0');
  const [selectPluralMajor, setSelectPluralMajor] = useState('0');
  const [personalDomain, setPersonalDomain] = useState('');
  const [inputPersonalDomain, setInputPersonalDomain] = useState('');
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
    github_id: '',
    username: '',
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
    primary_email: '',
    primary_email_domain: '',
    secondary_email: '',
    secondary_email_domain: '',
    account_interests: '',
    consent: false,
    consent_mandatory: false
  });

  const navigate = useNavigate();

  useEffect(() => {
    try {
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
        } else {
        }
      };
      getData();
    } catch (error) {
      console.log('error', error);
    }
  }, []);

  // Tag 저장을 위한 함수
  const handleSelectTag = (selectTags) => {
    setSelectTags(
      selectTags.map((tag) => {
        return tag.value;
      })
    );
  };

  const handleSelectCollege = (obj) => {
    setSelectCollege(obj.value);
  };

  const handleSelectPersonalDomain = (obj) => {
    setPersonalDomain(obj.value);
    setInputPersonalDomain(obj.value);
    setFormData((prev) => {
      const newData = prev;
      newData['personal_email_domain'] = obj.value;
      return newData;
    });
  };

  const handleSelectPrimaryDomain = (obj) => {
    // setPrimaryDomain(obj.value);
  };

  const handleSelectSecondaryDomain = (obj) => {
    setSecondaryDomain(obj.value);
    setInputSecondaryDomain(obj.value);
    setFormData((prev) => {
      const newData = prev;
      newData['secondary_email_domain'] = obj.value;
      return newData;
    });
  };

  const handleAbsence = (e) => {
    setSelectAbsence(e.target.value);
    setFormData((prev) => {
      const newData = prev;
      newData['absence'] = e.target.value;
      return newData;
    });
  };

  const handlePluralMajor = (e) => {
    setSelectPluralMajor(e.target.value);
    setFormData((prev) => {
      const newData = prev;
      newData['plural_major'] = e.target.value;
      return newData;
    });
  };

  const sendSignUpForm = async () => {
    try {
      const response = await axios.post(signUpFormUrl, formData);
      const res = response.data;
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
        if (res.feedback.college) {
          setLabels((prev) => {
            return { ...prev, college: { label: res.feedback.college, status: 'error' } };
          });
        }
        if (res.feedback.personal_email) {
          setLabels((prev) => {
            return { ...prev, personal_email: { label: res.feedback.personal_email, status: 'error' } };
          });
        }
        if (res.feedback.secondary_email) {
          setLabels((prev) => {
            return { ...prev, secondary_email: { label: res.feedback.secondary_email, status: 'error' } };
          });
        }
      } else {
        alert('회원가입에 성공했습니다.');
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
        const newData = prev;
        newData['personal_email_domain'] = e.target.value;
        return newData;
      });
    } else {
      setInputPersonalDomain(personalDomain);
      setFormData((prev) => {
        const newData = prev;
        newData['personal_email_domain'] = personalDomain;
        return newData;
      });
    }
  };
  const handleInputSecondaryDomain = (e) => {
    if (secondaryDomain === '') {
      setInputSecondaryDomain(e.target.value);
      formData['secondary_email_domain'] = e.target.value;
      setFormData((prev) => {
        const newData = prev;
        newData['secondary_email_domain'] = e.target.value;
        return newData;
      });
    } else {
      setInputSecondaryDomain(secondaryDomain);
      formData['secondary_email_domain'] = secondaryDomain;
      setFormData((prev) => {
        const newData = prev;
        newData['secondary_email_domain'] = secondaryDomain;
        return newData;
      });
    }
  };
  //유효성검사
  //가입하기 버튼을 눌렀을 때 실행되는 함수
  const onChangeUsername = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value.length < 5) {
      setLabels((prev) => {
        prev['username'] = { label: 'Username은 5자 이상이여야 합니다.', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['username'] = { label: '로그인에 사용할 아이디입니다.', status: 'info' };
        return prev;
      });
    }
  };

  const onChangePassword = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value.length < 4) {
      setLabels((prev) => {
        prev['password'] = { label: '비밀번호는 4자 이상이어야 합니다.', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['password'] = { label: '알맞은 형식의 비밀번호입니다.', status: 'info' };
        return prev;
      });
    }
  };

  const onChangeCheckPassword = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value === formData['password']) {
      setLabels((prev) => {
        prev['checkPassword'] = { label: '비밀번호와 일치합니다.', status: 'info' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['checkPassword'] = { label: 'password가 일치하지 않습니다.', status: 'error' };
        return prev;
      });
    }
  };

  const onChangeStudentId = (e) => {
    const { name, value } = e.target;
    const regex = /^[0-9]{10}$/;
    setFormData({
      ...formData,
      [name]: value
    });
    if (!regex.test(e.target.value)) {
      setLabels((prev) => {
        prev['student_id'] = { label: '학번 형식이 다릅니다.', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['student_id'] = { label: '알맞은 학번 형식입니다.', status: 'success' };
        return prev;
      });
    }
  };

  const onChangeName = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value.length > 20) {
      setLabels((prev) => {
        prev['name'] = { label: '이름은 20자를 넘을 수 없습니다.', status: 'error' };
        return prev;
      });
    } else if (value.length < 1) {
      setLabels((prev) => {
        prev['name'] = { label: '이름을 입력해주세요!', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['name'] = { label: '', status: 'success' };
        return prev;
      });
    }
  };

  const onChangeDept = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value.length > 45) {
      setLabels((prev) => {
        prev['dept'] = { label: '학과는 45자를 넘을 수 없습니다.', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['dept'] = { label: '', status: 'info' };
        return prev;
      });
    }
  };

  const onChangePersonalEmail = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value.length > 100) {
      setLabels((prev) => {
        prev['personal_email'] = { label: '이메일 주소는 100자를 넘을 수 없습니다.', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['personal_email'] = { label: '계정정보를 찾을 때 사용합니다.', status: 'info' };
        return prev;
      });
    }
  };

  const onChangeSecondaryEmail = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (value.length > 100) {
      setLabels((prev) => {
        prev['secondary_email'] = { label: '이메일 주소는 100자를 넘을 수 없습니다.', status: 'error' };
        return prev;
      });
    } else {
      setLabels((prev) => {
        prev['secondary_email'] = {
          label: '로컬 Git 설정 이메일이 GitHub와 다른가요? 추가로 이메일을 연동할 수 있습니다.',
          status: 'info'
        };
        return prev;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData((prev) => {
      const newData = prev;
      newData['github_id'] = 'hsh200315';
      newData['college'] = selectCollege;
      newData['absence'] = selectAbsence;
      newData['plural_major'] = selectPluralMajor;
      newData['account_interests'] = selectTags;
      newData['primary_email'] = 'qq';
      newData['primary_email_domain'] = 'naver.com';
      newData['consent'] = selectConsent;

      newData['consent_mandatory'] = selectConsentMandatory;
      console.log('newData');
      console.log(newData);
      return newData;
    });
    sendSignUpForm();
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
            <span>SOSD에 와주셔서 감사합니다! GitHub 정보 외의 추가 정보를 입력하고 가입해주세요!</span>
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
                <Form.Control id="github_id" placeholder="GitHub Username" aria-label="GitHub Username" disabled />
                <Button variant="outline-secondary" id="GitHubIdCheck" disabled>
                  Check
                </Button>
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
                  onChange={onChangeUsername}
                />
                <Button variant="outline-secondary" id="DuplicateCheck">
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
              <Form.Label className={labelClass[labels.password.status]}>{labels.password.label}</Form.Label>
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  id="password"
                  name="password"
                  onChange={onChangePassword}
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
                <Button variant="outline-secondary" id="StudentCheck">
                  Check
                </Button>
              </InputGroup>
            </div>
            <div className={classes.FormControl}>
              <Form.Label htmlFor="name" className="me-2">
                이름<span className={classes.RequiredStar}>*</span>
              </Form.Label>
              <Form.Label className={labelClass[labels.name.status]}>{labels.name.label}</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="ex) 홍길동"
                  aria-label="name"
                  id="name"
                  name="name"
                  onChange={onChangeName}
                />
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
              <Select size="sm" options={colleges} id="college" name="college" onChange={handleSelectCollege}></Select>
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
              />
              <InputGroup.Text>@</InputGroup.Text>
              <Form.Control
                placeholder="이메일 도메인"
                id="email_domain"
                name="personal_email_domain"
                onChange={handleInputPersonalDomain}
                value={inputPersonalDomain}
              />
              <Select options={domains} placeholder="직접입력" onChange={handleSelectPersonalDomain} />
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
              <Form.Control placeholder="깃헙 Email" id="primary_email" name="primary_email" disabled />
              <InputGroup.Text>@</InputGroup.Text>
              <Form.Control
                placeholder="이메일 도메인"
                id="primary_email_domain"
                name="primary_email_domain"
                disabled
              />
              <Select options={domains} placeholder="직접입력" isDisabled={true} onChange={handleSelectPrimaryDomain} />
            </InputGroup>
          </div>

          {/* ElseEmail */}
          <div className="mb-3">
            <label htmlFor="secondary_email">기타 연동 Email</label>
            <br />
            <Form.Label className={labelClass[labels.secondary_email.status]}>
              {labels.secondary_email.label}
            </Form.Label>
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
          <div className="mb-3">
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
          </div>
          <br />
          {/* 버튼 */}

          <button
            variant="secondary"
            onClick={() => {
              setOpenModal(!openModal);
              setSelectConsent(true);
              setClicked(true);
            }}
            type="button"
            className={`${clicked === true ? 'btn btn-primary ms-auto mb-1' : 'btn btn-secondary ms-auto mb-1'}`}
          >
            개인정보 이용내역 동의<span className="text-danger">*</span>
          </button>
          {openModal === true ? (
            <ConsentsModal
              consents={consents}
              show={openModal}
              changeModal={setOpenModal}
              mandatory={setSelectConsentMandatory}
              radioValue={consentRadios}
              changeRadioValue={setConsentRadios}
              changeMandatoryValue={setSelectConsentMandatory}
            />
          ) : null}
          <div className="d-flex flex-row justify-content-end">
            <Button variant="primary" type="submit">
              가입하기
            </Button>
          </div>
    </Form>
  );
};

export default SignUpForm;
