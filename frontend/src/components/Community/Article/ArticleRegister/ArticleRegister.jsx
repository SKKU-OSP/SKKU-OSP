import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { BsXLg } from 'react-icons/bs';
import { Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getAuthConfig } from '../../../../utils/auth';
import { EditorModules } from '../editor';
import ReactQuill from 'react-quill';

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
  const [articleFiles, setArticleFiles] = useState({});
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [tags, setTags] = useState([]);
  const [selectTags, setSelectTags] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const getCurrentDateTime = () => new Date();
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
      postArticle();
    }
  };

  const postArticle = async () => {
    try {
      const config = getAuthConfig();
      config.headers['Content-Type'] = 'multipart/form-data';

      const postData = {
        board_name: boardName,
        title: title,
        content: bodyText,
        is_notice: isAuthNotice,
        anonymous_writer: anonymousWriter,
        article_tags: selectTags,
        ...articleFiles,
        ...(boardName === '팀 모집' && {
          period_start: startDate,
          period_end: endDate,
          team_id: selectTeam.value
        })
      };

      const formData = new FormData();
      Object.entries(postData).forEach(([key, value]) => {
        if (key === 'article_tags') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });
      console.log(formData);
      const response = await axios.post(urlRegistArticle, formData, getAuthConfig());

      const res = response.data;
      if (res['status'] === 'success') {
        window.alert('등록이 완료되었습니다!');
        navigate(`/community/article/${res.data.article_id}`);
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
    setBodyText(e);
  };

  // File
  const handleFileChange = (event) => {
    const files = event.target.files;
    const all_files = articleFiles;
    var already_exist_files = '';

    for (let i = 0; i < files.length; i++) {
      if (all_files[files[i].name]) {
        if (already_exist_files.length) already_exist_files += ', ' + files[i].name;
        else already_exist_files += files[i].name;
      } else {
        all_files[files[i].name] = files[i];

        var file = document.createElement('div');
        file.id = files[i].name;
        file.classList.add('article-file');
        file.classList.add('d-flex');

        var delete_button = document.createElement('button');
        delete_button.classList.add('article-file-delete-btn');
        delete_button.append('X');
        delete_button.setAttribute('type', 'button');
        delete_button.onclick = function () {
          const all_files2 = articleFiles;
          delete all_files2[files[i].name];
          setArticleFiles(all_files2);
          this.parentElement.parentElement.removeChild(this.parentElement);
        };

        file.append(files[i].name);
        file.appendChild(delete_button);

        document.getElementById('file-list').appendChild(file);
      }
    }
    setArticleFiles(all_files);

    if (already_exist_files.length) {
      window.alert(already_exist_files + ' 파일은 이미 존재합니다.');
    }
  };

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

  // 뒤로가기 버튼
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
          <ReactQuill
            value={bodyText}
            onChange={handleBodyChange}
            modules={EditorModules}
            style={{ minHeight: '350px', zIndex: '1' }}
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
          <div className="community-file">
            <input
              type="file"
              id="article-files"
              name="article_files"
              className="article-files"
              onChange={handleFileChange}
              multiple
            />
            <div id="file-list"></div>
          </div>
        </form>
      </div>
    </>
  );
}

export default ArticleRegister;
