import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import Select from 'react-select';
import { BsXLg, BsSave } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import { Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ArticleEdit.css';
import { getAuthConfig } from '../../../../utils/auth';
import './ArticleEdit.css';
import AuthContext from '../../../../utils/auth-context';

/**
 * TARGET: content-edit.html
 */
const domainUrl = import.meta.env.VITE_SERVER_URL;

function ArticleEdit({ isWrite, type, consentWriteOpen }) {
  const articleID = useParams().article_id;
  const url = domainUrl + '/community/';
  const urlEditArticle = domainUrl + '/community/api/article/' + articleID + '/update/';
  const urlArticle = domainUrl + '/community/api/article/' + articleID;
  const urlTag = domainUrl + '/tag/api/list/';

  const article = {};
  const { username } = useContext(AuthContext);

  const [myArticle, setMyArticle] = useState(false);
  const [board, setBoard] = useState('');
  const [isAuthNotice, setIsAuthNotice] = useState(true);
  const [anonymousWriter, setAnonymousWriter] = useState(true);
  const [team, setTeam] = useState([]);
  const [numFile, setNumFile] = useState(0);
  const [fileObj, setFileObj] = useState({});
  const [articleFile, setArticleFile] = useState([]);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [tags, setTags] = useState([]);
  const [selectTags, setSelectTags] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [teamID, setTeamID] = useState('');
  const getCurrentDateTime = () => new Date();
  const editorRef = useRef(null);

  useEffect(() => {
    //axios 사용
    const getArticle = async () => {
      const response = await axios.get(url);
      const responseArticle = await axios.get(urlArticle);
      const responseTag = await axios.get(urlTag);
      const res = response.data;
      const resArticle = responseArticle.data;
      const resTag = responseTag.data;

      if (resArticle.status === 'success') {
        if (resArticle.data.article.writer.user.username !== username) {
          alert('본인의 게시글만 수정할 수 있습니다.');
          onBack();
        } else {
          setBoard(resArticle.data.article.board);
          // setBoard((prev) => { //여기 수정! Normal/QnA/Recruit/Notice
          //   prev['board_type'] = "Notice"
          //   return prev
          // });
          setTitle(resArticle.data.article.title);
          setBodyText(resArticle.data.article.body);
          setTags(
            resTag.data.tags.map((t) => {
              return {
                value: t.name,
                label: t.name,
                color: t.color
              };
            })
          );
          setSelectTags(
            resArticle.data.tags.map((t) => {
              return {
                value: t.name,
                label: t.name,
                color: t.color
              };
            })
          );
          setIsAuthNotice(resArticle.data.article.is_notice);
          setAnonymousWriter(resArticle.data.article.anonymous_writer);
          setArticleFile(
            resArticle.data.files.map((t) => {
              return {
                id: t.id,
                name: t.fileName,
                file: t.file.name
              };
            })
          );
          setMyArticle(true);
        }
      } else {
        console.log(resArticle.message);
      }
    };
    getArticle();
  }, []);

  // 익명 체크 여부 확인
  const anonymousCheck = () => {
    return anonymousWriter;
  };

  // 수정 버튼 클릭 시
  const onModify = async () => {
    if (board.board_type === 'Recruit') {
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
    } else if (window.confirm('글을 수정하시겠습니까?')) {
      // 수정한 글 저장
      if (editorRef.current) {
        console.log('title', title);
        console.log('bodyText', bodyText);
        console.log('tags', selectTags);
        console.log('ano', anonymousWriter);
        console.log('file', articleFile);

        const response = await axios.post(
          urlEditArticle,
          {
            title: title,
            content: bodyText,
            is_notice: false,
            anonymous_writer: false,
            article_tags: selectTags,
            article_file: articleFile,
            ...(board.board_type === 'Recruit' && {
              period_start: startDate,
              period_end: endDate
            })
          },
          getAuthConfig()
        );
        const res = response.data;
        if (res['status'] === 'success') {
          window.alert('수정이 완료되었습니다!');
          window.location.href = `/community/article/` + articleID + `/`;
        }

        console.log(res);
      }
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleBodyChange = (e) => {
    console.log(e.target.getContent());
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
    setArticleFile((prev) => [...prev, prev.length + 1]); //키 값 줄일 때 주의점 numFile 줄이면 안돼!!
    setNumFile(nextNum);

    console.log(numFile);
    console.log(nextNum + 'v');
  };
  console.log(Object.keys({ temp: 1 }));
  console.log(fileObj);
  console.log(articleFile);

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
      return {
        ...provided,
        backgroundColor: tagColor
      };
    }
  };

  const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
  ];
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
    window.location.href = `/community/article/${articleID}`;
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
      {myArticle ? (
        <>
          {renderConsentMessage}
          <div id="community-main" className="col-9">
            <div className="community-nav d-flex">
              {board.name === '질문' ? (
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
              <div className="board-name">{board.name} 게시판</div>
              {board.name === '질문' ? (
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
                  <button type="button" className="btn btn-primary" onClick={onModify}>
                    수정하기
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-primary" onClick={onModify}>
                  수정하기
                </button>
              )}
            </div>
            <form id="article-form" method="post" data-edit-type={type} encType="multipart/form-data">
              <input type="hidden" id="board-type" className="board_type" value={board.board_type} />
              <input type="hidden" id="board-name" className="board_name" value={board.name} />
              <input type="hidden" id="board-id" className="board_id" value={board.id} />
              <input type="hidden" id="article-id" className="article_id" value={article.id} />
              {board.board_type === 'Recruit' && (
                <input type="hidden" id="team-id" className="team_id" value={board.team_id} />
              )}
              <input
                type="text"
                id="article-title"
                name="title"
                className="form-control"
                value={title}
                placeholder="제목을 입력해 주세요"
                autofocus
                onChange={handleTitleChange}
              />
              {board.board_type === 'Recruit' && ( //여기 수정
                <>
                  {team ? (
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
                  ) : type === 'register' ? (
                    <Select id="team-option" name="team-option" className="form-select pointer">
                      {teamOptions(request.user)}
                    </Select>
                  ) : (
                    <Select id="team-option" name="team-option" className="form-select pointer" disabled>
                      <option value={article.team.id} selected>
                        {article.team.name}
                      </option>
                    </Select>
                  )}
                </>
              )}
              {/* <div id="article-body" className="form-control block-article" contentEditable="true" onChange={handleBodyChange}>
                {bodyText}
              </div> */}
              <Editor
                initialValue={bodyText}
                onInit={handleEditorInit}
                apiKey={'0g27ik0o894gdcxk2zb3wtiou6dep9z8of1jaga5qawhw9fx'}
                onChange={handleBodyChange}
                init={{
                  selector: board,
                  custom_undo_redo_levels: 10,
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
                    'removeformat help| image'
                }}
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
              <div id="article-helper" className="mt-2">
                <button type="button" id="add-file" className="btn btn-secondary" onClick={handleFile}>
                  파일 추가
                </button>
              </div>
              <div id="article-file-container">
                {articleFile.map(
                  (
                    id,
                    index //업로드 된 파일 목록
                  ) => (
                    <div id={`input-group-saved${index + 1}`} className="input-group my-1" key={index}>
                      <input
                        type="text"
                        name={`article_file_${id}`}
                        className="form-control article-file"
                        value={name}
                        readOnly
                      />
                      <button
                        type="button"
                        className="input-group-text default-btn"
                        onClick={() => deleteInput(`saved${index + 1}`)}
                      >
                        <BsXLg />
                      </button>
                    </div>
                  )
                )}
                {fileObj &&
                  Object.keys(fileObj).map(
                    (
                      id //파일 추가 input form으로 작성해서 제출할 때 console
                    ) => (
                      <div key={`${id}`} id={`input-group-${id}`} className="input-group my-1">
                        <input
                          type="file"
                          id={`article-file-${id}`}
                          name={`article_file_${id}`}
                          className="form-control article-file"
                        />
                        <button type="button" className="input-group-text default-btn" onClick={() => deleteInput(id)}>
                          <BsXLg />
                        </button>
                      </div>
                    )
                  )}
              </div>
              {board.board_type === 'Recruit' && (
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
            </form>
          </div>
        </>
      ) : (
        <LoaderIcon style={{ marginTop: '20px' }} />
      )}
    </>
  );
}

export default ArticleEdit;
