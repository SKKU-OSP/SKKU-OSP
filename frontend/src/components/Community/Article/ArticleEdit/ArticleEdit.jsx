import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import axios from 'axios';
import Select from 'react-select';
import { BsXLg, BsCalendar } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import DatePicker from 'react-datepicker';
import AuthContext from '../../../../utils/auth-context';
import { getAuthConfig } from '../../../../utils/auth';

import 'react-datepicker/dist/react-datepicker.css';
import './ArticleEdit.css';

/**
 * TARGET: content-edit.html
 */
const domainUrl = import.meta.env.VITE_SERVER_URL;

function ArticleEdit({ isWrite, type, consentWriteOpen }) {
  const articleID = useParams().article_id;
  const urlEditArticle = domainUrl + '/community/api/article/' + articleID + '/update/';

  const article = {};
  const username = useContext(AuthContext).username;
  const [myArticle, setMyArticle] = useState(false);
  const [board, setBoard] = useState('');
  const [isAuthNotice, setIsAuthNotice] = useState(true);
  const [anonymousWriter, setAnonymousWriter] = useState(true);
  const [team, setTeam] = useState([]);
  const [selectTeam, setSelectTeam] = useState({});
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
  const navigate = useNavigate();

  useEffect(() => {
    //axios 사용
    const getTag = async () => {
      const urlTag = domainUrl + '/tag/api/list/';
      const responseTag = await axios.get(urlTag);

      const resTag = responseTag.data;
      if (resTag.status === 'success') {
        setTags(
          resTag.data.tags.map((t) => {
            return {
              value: t.name,
              label: t.name,
              color: t.color
            };
          })
        );
      } else {
        console.log(resTag.message);
      }
    };
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
      const urlArticle = domainUrl + '/community/api/article/' + articleID;
      const responseArticle = await axios.get(urlArticle);
      const resArticle = responseArticle.data;
      if (resArticle.status === 'success') {
        if (resArticle.data.article.writer.user.username !== username) {
          alert('본인의 게시글만 수정할 수 있습니다.');
          navigate(`/community/article/${articleID}`);
        } else {
          setBoard(resArticle.data.article.board);
          setTitle(resArticle.data.article.title);
          setBodyText(resArticle.data.article.body);
          if (resArticle.data.article.board.board_type === 'Recruit') {
            const start = new Date(resArticle.data.article.period_start);
            const end = new Date(resArticle.data.article.period_end);

            setStartDate(start);
            setEndDate(end);
            setSelectTeam(resArticle.data.team);
          }

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
    // username에 값이 할당된 경우에 요청
    if (username !== null) {
      getArticle();
      getTag();
      getTeam();
    }
  }, [username, articleID, navigate]);

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
              period_end: endDate,
              team_id: selectTeam.value
            })
          },
          getAuthConfig()
        );
        const res = response.data;
        console.log(res);
        if (res['status'] === 'success') {
          window.alert('수정이 완료되었습니다!');
          window.location.href = `/community/article/` + articleID + `/`;
        }
      }
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

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
    setArticleFile((prev) => [...prev, prev.length + 1]); //키 값 줄일 때 주의점 numFile 줄이면 안돼!!
    setNumFile(nextNum);

    console.log(numFile);
    console.log(nextNum + 'v');
  };

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

  const handleOption = (team) => {
    setSelectTeam(team);
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
    navigate(`/community/article/${articleID}`);
  };

  //정보공개 미동의 시 뜨는 창
  const renderConsentMessage = !isWrite && type === 'register' && (
    <div>
      <p>정보공개에 동의하지 않아 사용할 수 없는 기능입니다.</p>
      <button className="btn btn-primary" onClick={() => consentWriteOpen(username)}>
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
              <div>
                <button type="button" className="btn btn-secondary" onClick={onBack}>
                  뒤로가기
                </button>
              </div>
              <div className="board-name">{board.name} 게시판</div>
              {board.name === '질문' ? (
                <div>
                  <div className="anonymous-btn align-middle">
                    <input
                      type="checkbox"
                      id="is-anonymous"
                      checked={anonymousWriter}
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
                autoFocus
                onChange={handleTitleChange}
              />
              {board.board_type === 'Recruit' && (
                <>
                  {team ? (
                    <Select
                      placeholder={'팀 선택'}
                      options={team}
                      menuPlacement="auto"
                      value={selectTeam.name}
                      onChange={handleOption}
                      closeMenuOnSelect={true}
                      hideSelectedOptions={false}
                      styles={customStyle}
                      className="select-team"
                    />
                  ) : type === 'register' ? (
                    <Select id="team-option" name="team-option" className="form-select pointer">
                      {teamOptions()}
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
              <Editor
                initialValue={bodyText}
                onInit={handleEditorInit}
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
              {board.board_type === 'Recruit' && (
                <div id="period-setting">
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
                          className="log-event input-group select-team"
                          data-td-target-input="nearest"
                          data-td-target-toggle="nearest"
                        >
                          <div className="mt-1 d-flex">
                            <DatePicker
                              selected={startDate}
                              onChange={(date) => setStartDate(date)}
                              selectsStart
                              fixedHeight
                              dateFormat="MM/dd/yyyy, hh:mm aa"
                              showTimeInput
                              className="form-control"
                            ></DatePicker>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6 d-flex">
                        <div id="date-label" className="p-date-label d-flex">
                          <a>To</a>
                        </div>
                        <div
                          id="PeriodPickerEnd"
                          className="log-event input-group select-team"
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
                      className="btn btn-outline-secondary"
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
