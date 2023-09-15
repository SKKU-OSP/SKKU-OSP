import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import Select from 'react-select';
import { BsXLg } from 'react-icons/bs';
import { Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAuthConfig } from '../../../../utils/auth';

import '../../Board/Board.css';

const domainUrl = import.meta.env.VITE_SERVER_URL;

function ArticleRegister({ isWrite, type, consentWriteOpen }) {
  const boardName = useParams().board_name;
  const url = domainUrl + 'community/' + boardName + '/';
  const urlRegistArticle = domainUrl + '/community/api/article/create/';
  const urlTag = domainUrl + '/tag/api/list/';
  const navigate = useNavigate();

  const article = {};
  const [isAuthNotice, setIsAuthNotice] = useState(false);
  const [anonymousWriter, setAnonymousWriter] = useState(false);
  const [team, setTeam] = useState([]);
  const [selectTeam, setSelectTeam] = useState({});
  const [numFile, setNumFile] = useState(0);
  const [fileObj, setFileObj] = useState({});
  const [articleFile, setArticleFile] = useState({});
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [tags, setTags] = useState([]);
  const [selectTags, setSelectTags] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const getCurrentDateTime = () => new Date();
  const editorRef = useRef(null);
  const [isTeamRegistration, setIsTeamRegistration] = useState(false);

  useEffect(() => {
    //axios 사용
    const getTeam = async () => {
      const urlTeam = domainUrl + '/team/api/teams-of-user-list/';
      const responseTeam = await axios.get(urlTeam, getAuthConfig());

      const resTeam = responseTeam.data;
      if (resTeam.status === 'success') {
        setTeam(
          resTeam.data.teams_of_user.map((t) => {
            return {
              value: t.id,
              label: t.name
            };
          })
        );
      } else {
        console.log(resTeam.message);
      }
    };
    const getArticle = async () => {
      try {
        const responseTag = await axios.get(urlTag);
        const resTag = responseTag.data;
        setTags(
          resTag.data.tags.map((t) => {
            return {
              value: t.name,
              label: t.name,
              color: t.color
            };
          })
        );
        if (boardName === '공지') {
          setIsAuthNotice(!isAuthNotice);
        }
      } catch (error) {
        console.error(error);
      }
    };
    getArticle();
    getTeam();
  }, []);

  // 익명 체크 여부 확인
  const anonymousCheck = () => {
    console.log(anonymousWriter);
    return anonymousWriter;
  };

  // 저장 버튼 클릭 시
  const handleShow = (event) => {
    event.preventDefault();
    if (boardName === '팀 모집') {
      if (team === null) {
        window.alert('모집할 팀을 선택해 주세요');
        return;
      }
      if (!startDate || !endDate) {
        window.alert('모집 기간을 입력해 주세요');
        return;
      }
      const offset = new Date().getTimezoneOffset() * 60000;
      const period_start_date = startDate.getTime() - offset;
      const period_end_date = endDate.getTime() - offset;

      if (period_start_date > period_end_date - 3600000) {
        window.alert('날짜 입력에 오류가 있습니다. 모집 기간은 최소 1시간이 되도록 설정해 주세요.');
        return;
      }
    }
    if (title.trim() === '') {
      window.alert('제목을 입력해 주세요');
    } else if (bodyText.trim() === '') {
      window.alert('본문을 입력해 주세요');
      return;
    } else if (window.confirm('글을 등록하시겠습니까?')) {
      // 글 등록
      if (editorRef.current) {
        console.log('title', title);
        console.log('bodyText', bodyText);
        console.log('tags', selectTags);
        console.log('ano', anonymousWriter);
        console.log('isn', isAuthNotice);
        console.log('ps', startDate);
        console.log('pe', endDate);
        console.log('team', team);
        console.log('articleFile', articleFile);

        postArticle();
      }
    }
  };

  const postArticle = async () => {
    try {
      const config = getAuthConfig();
      config.headers['Content-Type'] = 'multipart/form-data';
      console.log('config', config);

      const postData = {
        board_name: boardName,
        title: title,
        content: bodyText,
        is_notice: isAuthNotice,
        anonymous_writer: anonymousWriter,
        article_tags: selectTags,
        ...articleFile,
        ...(boardName === '팀 모집' && {
          period_start: startDate,
          period_end: endDate,
          team_id: selectTeam.value
        })
      };

      const formData = new FormData();
      Object.entries(postData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      console.log('postData', postData);
      for (let key of formData) {
        console.log('key', key, formData[key]);
      }
      const response = await axios.post(urlRegistArticle, formData, getAuthConfig());

      const res = response.data;
      console.log(res);
      if (res['status'] === 'success') {
        window.alert('등록이 완료되었습니다!');
        navigate(`/community/board/${boardName}/`);
      } else {
        window.alert(res['message']);
        return;
      }
    } catch (error) {
      console.error('에러:', error);
      window.alert('Error Occured');
    }
  };

  // Title
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  // Body
  const handleBodyChange = (e) => {
    setBodyText(e.target.getContent());
  };

  const handleEditorInit = (editor) => {
    editorRef.current = editor;
  };

  // File
  const handleFile = () => {
    const nextNum = numFile + 1;

    setFileObj((prev) => {
      const prevObj = { ...prev };
      prevObj[nextNum] = nextNum;
      return prevObj;
    });
    // setArticleFile((prev) => [...prev, prev.length + 1]);//키 값 줄일 때 주의점 numFile 줄이면 안돼!!
    if (inputRef.current && inputRef.current.files && inputRef.current.files.length > 0) {
      const newFileObj = { ...fileObj };
      const newArticleFiles = [...articleFile];
      for (let i = 0; i < inputRef.current.files.length; i++) {
        const file = inputRef.current.files[i];
        newFileObj[nextNum + i] = file;
        newArticleFiles.push(file);
      }
      setFileObj(newFileObj);
      setArticleFile(newArticleFiles);
    }
    setNumFile(nextNum);

    // console.log(numFile);
    // console.log(nextNum + "v");
  };
  // console.log(Object.keys({temp:1}))
  // console.log("file", articleFile);
  // console.log("Obj", fileObj);

  const inputRef = useRef < HTMLInputElement > null;

  const deleteInput = (id) => {
    const updatedFileObj = { ...fileObj };
    delete updatedFileObj[id];

    const newFileObj = setFileObj(updatedFileObj);

    const store = new DataTransfer();
    Object.values(newFileObj).forEach((file) => store.items.add(file));

    if (inputRef.current) {
      inputRef.current.files = store.files;
    }
  };

  const handleFileChange = (event) => {
    const fileName = event.target.name;
    const fileObjs = { ...articleFile };
    fileObjs[fileName] = event.target.files[0];

    setArticleFile(fileObjs);

    console.log('fileObj', fileObjs);
  };

  // Tag
  // Tag
  const handleOptionSelect = (selectedTags) => {
    setSelectTags(selectedTags);
  };
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'lightgray' : 'black',
      background: 'none'
    }),
    multiValue: (provided, state) => {
      const tagColor = state.data.color;

      if (tagColor) {
        const hexColor = tagColor.substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
        const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
        const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const fontColor = luma < 127.5 ? 'white' : 'black';

        return {
          ...provided,
          backgroundColor: tagColor,
          color: fontColor
        };
      }
    },
    multiValueLabel: (provided, state) => {
      const tagColor = state.data.color;

      if (tagColor) {
        const hexColor = tagColor.substring(1);
        const r = parseInt(hexColor.substring(0, 2), 16) & 0xff;
        const g = parseInt(hexColor.substring(2, 4), 16) & 0xff;
        const b = parseInt(hexColor.substring(4, 6), 16) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const fontColor = luma < 127.5 ? 'white' : 'black';

        return {
          ...provided,
          backgroundColor: tagColor,
          color: fontColor
        };
      }
    }
  };

  // Team
  const handleOption = (team) => {
    setTeam(team);
  };
  const customStyle = {
    control: (provided) => ({
      ...provided,
      height: '45px'
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'lightgray' : 'black',
      background: 'none'
    })
  };

  const onBack = () => {
    // TODO 팀 게시판의 경우를 고려해서 navigate(`/community/team/${boardName}/`) 을 사용해야함
    if (boardName === '팀 모집') {
      navigate(`/community/recruit/${boardName}/`);
    } else if (boardName === '자유' || boardName === '정보' || boardName === '질문' || boardName === '홍보') {
      navigate(`/community/board/${boardName}/`);
    } else {
      navigate(`/community/team/${boardName}/`);
    }
  };

  //정보공개 미동의 시 뜨는 창
  const renderConsentMessage = !isWrite && type === 'register' && (
    <div>
      <p>정보공개에 동의하지 않아 사용할 수 없는 기능입니다.</p>
      <button className="btn btn-primary" onClick={() => consentWriteOpen(request.user.username)}>
        정보공개하기
      </button>
    </div>
  );

  return (
    <>
      {renderConsentMessage}
      <div id="community-main" className="col-9">
        <form id="article-form" method="post" data-edit-type={type} encType="multipart/form-data" onSubmit={handleShow}>
          <div className="community-nav d-flex">
            {boardName === '질문' ? (
              <div>
                <button type="button" className="btn btn-secondary" onClick={onBack}>
                  뒤로가기
                </button>
                <div className="anonymous-btn align-middle hidden">
                  <input type="checkbox" /> <label>익명</label>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                뒤로가기
              </button>
            )}
            <div className="board-name">{boardName} 게시판</div>
            {boardName === '질문' ? (
              <div>
                <div className="anonymous-btn align-middle">
                  <input
                    type="checkbox"
                    id="is-anonymous"
                    checked={anonymousCheck()}
                    onChange={() => setAnonymousWriter(!anonymousWriter)}
                  />{' '}
                  <label htmlFor="is-anonymous">익명</label>
                </div>
                <button type="submit" className="btn btn-primary">
                  작성하기
                </button>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary">
                작성하기
              </button>
            )}
          </div>
          <input
            type="text"
            id="article-title"
            name="title"
            className="form-control"
            value={title}
            placeholder="제목을 입력해 주세요"
            autoFocus
            onChange={handleTitleChange}
          />
          {boardName === '팀 모집' && ( //여기 수정
            <>
              {team ? (
                <Select
                  placeholder={'팀 선택'}
                  options={team}
                  menuPlacement="auto"
                  value={team}
                  onChange={handleOption}
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  styles={customStyle}
                  className="select-team"
                />
              ) : (
                <>
                  {isTeamRegistration ? (
                    <Select id="team-option" name="team-option" className="form-select pointer">
                      {teamOptions(request.user)}
                    </Select>
                  ) : (
                    <Select
                      placeholder={'팀 선택'}
                      options={options}
                      menuPlacement="auto"
                      value={team}
                      onChange={handleOption}
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      styles={customStyle}
                    />
                  )}
                </>
              )}
            </>
          )}
          <Editor
            initialValue={bodyText}
            onInit={handleEditorInit}
            onChange={handleBodyChange}
            init={{
              height: 350,
              branding: false,
              statusbar: false,
              paste_data_images: true,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount',
                'undo',
                'redo'
              ],
              toolbar:
                'undo redo | fontfamily ' +
                'bold italic underline strikethrough forecolor backcolor align | ' +
                'removeformat help| image',
              forced_root_block: 'div'
            }}
            style={{ zIndex: 1 }}
          />

          <Select
            placeholder={'Tag'}
            options={tags}
            isMulti
            menuPlacement="auto"
            value={selectTags}
            onChange={handleOptionSelect}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            styles={customStyles}
          />
          {boardName === '팀 모집' && (
            <div id="period-setting" className="mt-3">
              <div className="d-flex">
                <div id="date-label" className="p-date-label d-flex">
                  모집 기간
                </div>
                <div className="row flex-fill">
                  <div className="col-sm-6 d-flex">
                    <div id="date-label" className="p-date-label d-flex">
                      <a>From</a>
                    </div>
                    <div
                      id="PeriodPickerStart"
                      InputGroup
                      className="log-event"
                      data-td-target-input="nearest"
                      data-td-target-toggle="nearest"
                    >
                      <div className="mt-1">
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          selectsStart
                          fixedHeight
                          dateFormat="MM/dd/yyyy, hh:mm aa"
                          showTimeInput
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 d-flex">
                    <div id="date-label" className="p-date-label d-flex">
                      <a>To</a>
                    </div>
                    <div
                      id="PeriodPickerEnd"
                      InputGroup
                      className="log-event"
                      data-td-target-input="nearest"
                      data-td-target-toggle="nearest"
                    >
                      <div className="mt-1">
                        <DatePicker
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          selectsEnd
                          fixedHeight
                          dateFormat="MM/dd/yyyy, hh:mm aa"
                          minDate={new Date()}
                          showTimeInput
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  id="end-button"
                  type="button"
                  className="btn btn-outline-light"
                  onClick={() => setEndDate(getCurrentDateTime())}
                >
                  마감
                </button>
              </div>
            </div>
          )}
          <div id="article-helper" className="mt-2">
            <button type="button" id="add-file" className="btn btn-secondary" onClick={handleFile}>
              파일 추가
            </button>
          </div>
          <div id="article-file-container">
            {fileObj &&
              Object.keys(fileObj).map(
                (
                  id //파일 추가 input
                ) => (
                  <div key={`${id}`} id={`input-group-${id}`} className="input-group my-1">
                    <input
                      type="file"
                      id={`article-file-${id}`}
                      name={`article_file_${id}`}
                      className="form-control article-file"
                      onChange={handleFileChange}
                    />
                    <button type="button" className="input-group-text default-btn" onClick={() => deleteInput(id)}>
                      <BsXLg />
                    </button>
                  </div>
                )
              )}
          </div>
        </form>
      </div>
    </>
  );
}

export default ArticleRegister;
