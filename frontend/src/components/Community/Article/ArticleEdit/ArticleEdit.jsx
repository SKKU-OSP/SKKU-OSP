import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { BsChevronLeft, BsPencilSquare } from 'react-icons/bs';
import LoaderIcon from 'react-loader-icon';
import DatePicker from 'react-datepicker';
import AuthContext from '../../../../utils/auth-context';
import { getAuthConfig } from '../../../../utils/auth';
import { EditorModules } from '../editor';
import ReactQuill from 'react-quill';

import 'react-datepicker/dist/react-datepicker.css';
import './ArticleEdit.css';

/**
 * TARGET: content-edit.html
 */
const domainUrl = import.meta.env.VITE_SERVER_URL;

function ArticleEdit({ isWrite, type, consentWriteOpen }) {
  const articleID = useParams().article_id;
  const urlEditArticle = domainUrl + '/community/api/article/' + articleID + '/update/';
  const username = useContext(AuthContext).username;
  const navigate = useNavigate();

  const article = {};
  const [myArticle, setMyArticle] = useState(false);
  const [board, setBoard] = useState('');
  const [isAuthNotice, setIsAuthNotice] = useState(true);
  const [anonymousWriter, setAnonymousWriter] = useState(true);
  const [team, setTeam] = useState([]);
  const [selectTeam, setSelectTeam] = useState('');
  const [existFiles, setExistFiles] = useState({});
  const [articleFiles, setArticleFiles] = useState({});
  const [heroArticleFile, setHeroArticleFile] = useState({});
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [tags, setTags] = useState([]);
  const [selectTags, setSelectTags] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const getCurrentDateTime = () => new Date();
  const [isHero, setIsHero] = useState(false);

  useEffect(() => {
    //axios 사용
    const getTag = async () => {
      const urlTag = domainUrl + '/tag/api/list/';
      const responseTag = await axios.get(urlTag, getAuthConfig());

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
      const urlArticle = domainUrl + '/community/api/article/' + articleID + '/';
      const responseArticle = await axios.get(urlArticle, getAuthConfig());
      const resArticle = responseArticle.data;
      if (resArticle.status === 'success') {
        if (resArticle.data.article.writer.user.username !== username && username != 'admin') {
          alert('본인의 게시글만 수정할 수 있습니다.');
          navigate(`/community/article/${articleID}`);
        } else {
          setBoard(resArticle.data.article.board);
          setTitle(resArticle.data.article.title);
          setBodyText(resArticle.data.article.body);
          setIsHero(resArticle.data.article.is_hero);
          if (resArticle.data.article.board.board_type === 'Recruit') {
            const start = new Date(resArticle.data.article.period_start);
            const end = new Date(resArticle.data.article.period_end);

            start.setHours(start.getHours() - 9);
            end.setHours(end.getHours() - 9);

            setStartDate(start);
            setEndDate(end);
            setSelectTeam(
              resArticle.data.team
                ? {
                    value: resArticle.data.team.id,
                    label: resArticle.data.team.name
                  }
                : null
            );
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

          const heroFiles = [];
          const normalFiles = [];

          const getHeroArticles = async () => {
            const urlHeroArticles = domainUrl + '/community/api/heroes/';
            const responseHeroArticles = await axios.get(urlHeroArticles, getAuthConfig());
            const resHeroArticles = responseHeroArticles.data;

            if (resHeroArticles.status === 'success') {
              const heroArticle = resHeroArticles.data.hero_articles.find(
                (hero) => hero.article_id === resArticle.data.article.id
              );
              if (heroArticle) {
                heroFiles.push({
                  id: resArticle.data.article.id,
                  name: heroArticle.thumbnail.file.split('/').pop(),
                  file: heroArticle.thumbnail.file,
                  size: heroArticle.thumbnail.size
                });
              }

              resArticle.data.files.forEach((file) => {
                const fileNameWithoutExtension = file.file.split('/').pop();
                if (!heroFiles.some((heroFile) => heroFile.name === fileNameWithoutExtension)) {
                  normalFiles.push(file);
                }
              });

              setHeroArticleFile(heroFiles.length > 0 ? { [heroFiles[0].name]: heroFiles[0] } : {});
              const exist_files = {};
              normalFiles.forEach((file) => {
                exist_files[file.id] = file;
              });
              setExistFiles(exist_files);
              setMyArticle(true);
            } else {
              console.log(resHeroArticles.message);
            }
          };

          getHeroArticles();
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

  // hero 게시글 체크 여부 확인
  const heroCheck = () => {
    return isHero;
  };

  // 수정 버튼 클릭 시
  const handleShow = (event) => {
    event.preventDefault();
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
    } else if (bodyText.trim() === '' || bodyText.trim() === '<p><br></p>') {
      window.alert('본문을 입력해 주세요');
      return;
    } else if (isHero && Object.keys(heroArticleFile).length === 0) {
      window.alert('메인페이지 게시용 썸네일을 추가해 주세요.');
      return;
    } else if (window.confirm('글을 수정하시겠습니까?')) {
      postArticle();
    }
  };

  const postArticle = async () => {
    try {
      const config = getAuthConfig();
      config.headers['Content-Type'] = 'multipart/form-data';

      console.log(articleFiles);
      const postData = {
        title: title,
        content: bodyText,
        is_notice: isAuthNotice,
        anonymous_writer: anonymousWriter,
        article_tags: selectTags,
        file_id_list: Object.keys(existFiles),
        ...articleFiles,
        ...(board.board_type === 'Recruit' && {
          period_start: toKST(startDate).toISOString(),
          period_end: toKST(endDate).toISOString(),
          team_id: selectTeam.value
        }),
        ...(board.board_type === 'Promotion' && {
          is_hero: isHero
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

      if (isHero) {
        Object.entries(heroArticleFile).forEach(([key, value]) => {
          formData.append('hero_thumbnail', value);
        });
      }

      console.log(formData);
      const response = await axios.post(urlEditArticle, formData, getAuthConfig());

      const res = response.data;
      if (res['status'] === 'success') {
        window.alert('수정이 완료되었습니다!');
        navigate(`/community/article/${articleID}/`);
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
      var isExist = false;
      Object.entries(existFiles).map(([key, file]) => {
        if (file.name == files[i].name) isExist = true;
      });

      if (all_files[files[i].name] || isExist) {
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

  // Hero File
  const handleHeroFileChange = (event) => {
    if (Object.keys(heroArticleFile).length > 0) {
      window.alert('파일은 하나만 선택 가능합니다. 삭제 후 다른 파일을 추가하십시오.');
      return;
    }

    const files = event.target.files[0];
    if (!files) return;
    const all_file = heroArticleFile;
    all_file[files.name] = files;

    var file = document.createElement('div');
    file.id = files.name;
    file.classList.add('article-file');
    file.classList.add('d-flex');

    var delete_button = document.createElement('button');
    delete_button.classList.add('article-file-delete-btn');
    delete_button.append('X');
    delete_button.setAttribute('type', 'button');
    delete_button.onclick = function () {
      const updatedFiles = { ...heroArticleFile };
      delete updatedFiles[files.name];
      this.parentElement.remove();
      setHeroArticleFile(updatedFiles);
    };

    file.append(files.name);
    file.appendChild(delete_button);

    document.getElementById('hero-file-list').appendChild(file);
    setHeroArticleFile(all_file);
  };

  // Tag
  const handleOptionSelect = (selectedTags) => {
    if (selectedTags.length <= 5) {
      setSelectTags(selectedTags);
    } else {
      setSelectTags(selectedTags.slice(0, 5));
    }
  };
  const customStyles = {
    control: (provided) => ({
      ...provided,
      height: '45px',
      margin: '10px 0px',
      borderRadius: '15px'
    }),
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
    setSelectTeam(team);
  };
  const customStyle = {
    control: (provided) => ({
      ...provided,
      height: '45px',
      margin: '2px 0px 10px',
      borderRadius: '15px'
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'lightgray' : 'black',
      background: 'none'
    })
  };

  //Team 모집 기간
  const toKST = (date) => {
    const koreaTimezoneOffset = 9 * 60; // KST is UTC+9
    const diff = koreaTimezoneOffset - date.getTimezoneOffset();
    return new Date(date.getTime() + diff * 60 * 1000);
  };

  // 뒤로가기 버튼
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
            <form
              id="article-form"
              method="post"
              data-edit-type={type}
              encType="multipart/form-data"
              onSubmit={handleShow}
            >
              <div className="community-nav d-flex">
                <div>
                  <button type="button" className="btn-back" onClick={onBack}>
                    <BsChevronLeft style={{ marginRight: '7px', marginBottom: '5px' }} />
                    뒤로가기
                  </button>
                </div>
                <div className="board-name">{board.name} 게시판</div>
                {board.name === '질문' ? (
                  <div>
                    <div className="anonymous-btn">
                      <input
                        type="checkbox"
                        id="is-anonymous"
                        checked={anonymousWriter}
                        onChange={() => setAnonymousWriter(!anonymousWriter)}
                      />{' '}
                      <label htmlFor="is-anonymous">익명</label>
                    </div>
                    <button type="button" className="btn-write">
                      <BsPencilSquare style={{ marginRight: '7px', marginBottom: '5px' }} />
                      저장하기
                    </button>
                  </div>
                ) : board.name === '홍보' ? (
                  <div>
                    <div className="anonymous-btn">
                      <input type="checkbox" id="is-hero" checked={heroCheck()} onChange={() => setIsHero(!isHero)} />{' '}
                      <label htmlFor="is-hero">메인페이지 게시</label>
                    </div>
                    <button type="submit" className="btn-write">
                      <BsPencilSquare style={{ marginRight: '7px', marginBottom: '5px' }} />
                      저장하기
                    </button>
                  </div>
                ) : (
                  <button type="submit" className="btn-write">
                    <BsPencilSquare style={{ marginRight: '7px', marginBottom: '5px' }} />
                    저장하기
                  </button>
                )}
              </div>
              <input type="hidden" id="board-type" className="board_type" value={board.board_type} />
              <input type="hidden" id="board-name" className="board_name" value={board.name} />
              <input type="hidden" id="board-id" className="board_id" value={board.id} />
              <input type="hidden" id="article-id" className="article_id" value={article.id} />
              {board.board_type === 'Recruit' && (
                <input type="hidden" id="team-id" className="team_id" value={board.team_id} />
              )}
              <div className="article-design">
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
                <div className="divider hidden"></div>
                {board.board_type === 'Recruit' && (
                  <>
                    {team ? (
                      <Select
                        placeholder={'팀 선택'}
                        options={team}
                        menuPlacement="auto"
                        value={selectTeam}
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
                <div className="divider"></div>
                <ReactQuill
                  value={bodyText}
                  onChange={handleBodyChange}
                  modules={EditorModules}
                  className="article-body-edit"
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
                            className="log-event input-group"
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
                            className="log-event input-group"
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
                <div className="community-file">
                  <input type="file" name="article_files" onChange={handleFileChange} multiple />
                  <div id="file-list">
                    {Object.entries(existFiles).map(([key, file]) => {
                      return (
                        <div id={file.name} key={file.id} className="article-file d-flex">
                          {file.name}
                          <button
                            type="button"
                            className="article-file-delete-btn"
                            onClick={function () {
                              const all_files = existFiles;
                              delete all_files[file.id];
                              setExistFiles(all_files);
                              var this_element = document.getElementById(file.name);
                              document.getElementById('file-list').removeChild(this_element);
                            }}
                          >
                            X
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {board.board_type === 'Promotion' && isHero && (
                  <div className="community-file">
                    <div style={{ display: 'flex' }}>
                      <div style={{ color: '#000000', marginRight: '10px' }}>메인페이지 게시용 썸네일</div>
                      <input type="file" name="hero_article_files" onChange={handleHeroFileChange} multiple />
                    </div>
                    <div id="hero-file-list">
                      {Object.entries(heroArticleFile).map(([key, file]) => (
                        <div id={file.name} key={file.id} className="article-file d-flex">
                          {file.name}
                          <button
                            type="button"
                            className="article-file-delete-btn"
                            onClick={function () {
                              const all_file = heroArticleFile;
                              delete all_file[file.id];
                              setHeroArticleFile(all_file);
                              var this_element = document.getElementById(file.name);
                              // if (this_element) {
                              //   this_element.parentElement.removeChild(this_element);
                              // }
                              document.getElementById('hero-file-list').removeChild(this_element);
                            }}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
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
