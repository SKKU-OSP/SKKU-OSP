import React, { useEffect, useState } from 'react';
import { BsPencilSquare, BsPlus, BsXLg } from "react-icons/bs";
import { Button } from 'react-bootstrap';
import axios from 'axios'

import './ArticleEdit.css';
import { useParams } from 'react-router-dom';
/**
 * TARGET: content-edit.html
 */
const domainUrl = import.meta.env.VITE_SERVER_URL


function ArticleEdit({ isWrite, type, isAuthNotice, noticeCheck, anonymousCheck, board = {}, typeKr, consentWriteOpen }) {
  const renderConsentMessage = !isWrite && type === 'register' && (
    <div>
      <p>정보공개에 동의하지 않아 사용할 수 없는 기능입니다.</p>
      <button className="btn btn-primary" onClick={() => consentWriteOpen(request.user.username)}>
        정보공개하기
      </button>
    </div>
  );

  const articleID = useParams().article_id

  const url = domainUrl + "/community/api/article/" + articleID

  const article = {}
  const [numFile, setnumFile] = useState(0);
  const [fileObj, setfileObj] = useState({});
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);

  const [articleFile, setArticleFile] = useState([]);

  const [title, setTitle] = useState("");
  const [bodyText, setbodyText] = useState("");
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const getArticle = async() => {
      const response = await axios.get(url);
      const res = response.data;
      if(res.status === "success"){
        setTitle(res.data.article.title);
        setbodyText(res.data.article.body);
        setTags(res.data.tags);
      }
      else{console.log(res.message)}
    }

    getArticle()
  }, [])

  // const handleChange = (event) => setArticleFile(event.target.value);
  const handleFile = () => {
    const nextNum = numFile + 1;
    
    setfileObj((prev) => {
      const prevObj = {...prev};
      prevObj[nextNum] = nextNum;
      return prevObj});
    setArticleFile((prev) => [...prev, prev.length + 1]);//키 값 줄일 떄 주의점 numFile 줄이면 안돼!!
    setnumFile(nextNum);
  }
  const deleteInput = () => {
    const updatedFileObj = { ...fileObj };
    delete updatedFileObj[id];
    setFileObj(updatedFileObj);
  }

  console.log(Object.keys({temp:1}))

  const handleClick = () => {
    setIsSearchVisible(!isSearchVisible);
    setIsListVisible(!isListVisible);
  };

  const handleShow = () => {
    if(window.confirm("글을 수정하시겠습니까?")){
      window.alert("수정이 완료되었습니다!");
    };
  };
  
  return(
    <>
      {renderConsentMessage}
      <div id='community-main' className="col-md-9">
        <div id="board-title-bar" className="flex-between">
          <div id="board-title" className="p-board-title">
            <a href={'/community/board/${board.name}/${board.id}'}>                   
                {board.name} 게시판
            </a>
          </div>
          <div className="d-flex justify-content-end gap-2">
            {isAuthNotice && (
              <div className="p-board-title">
                  <input type="checkbox" id="is-notice" className="align-middle" checked={noticeCheck} />
                <label htmlFor="is-notice">공지</label>
              </div>
            )}
            {board.anonymous_writer && (
              <div className="p-board-title">
                  <input type="checkbox" id="is-anonymous" className="align-middle" checked={anonymousCheck} />
                <label htmlFor="is-anonymous">익명</label>
              </div>
            )}
            <Button variant="transparent" onClick={handleShow} type="button" id="btn-content-edit" className="btn btn-outline-light">
              <BsPencilSquare /> 수정 {typeKr}
            </Button>
          </div>
        </div>
        <form id="article-form" method="post" data-edit-type={type} encType="multipart/form-data">
          <input type="hidden" id="board-type" className="board_type" value={board.board_type} />
          <input type="hidden" id="board-name" className="board_name" value={board.name} />
          <input type="hidden" id="board-id" className="board_id" value={board.id} />
          <input type="hidden" id="article-id" className="article_id" value={article.id} />
          {board.board_type === 'Team' && 
            <input type="hidden" id="team-id" className="team_id" value={board.team.id} />
          }
          <div className="d-flex flex-column border border-2">
            <div className="d-flex justify-content-between mb-1">
              <input type="text" id="article-title" name="title" className="form-control" value={title} placeholder="제목을 입력해 주세요" required autofocus />
              {board.board_type === 'Recruit' && (
                <>
                  {team ? (
                    <select id="team-option" name="team-option" className="form-select pointer" disabled>
                      <option value={team.id} selected>{team.name}</option>
                    </select>
                  ) : type === 'register' ? (
                    <select id="team-option" name="team-option" className="form-select pointer" required>
                      {teamOptions(request.user)}
                    </select>
                  ) : (
                    <select id="team-option" name="team-option" className="form-select pointer" disabled>
                      <option value={article.team.id} selected>{article.team.name}</option>
                    </select>
                  )}
                </>
              )}
            </div>
            <div className="mt-2">
              <div id="article-body" className="form-control block-article" contentEditable="true">
                {bodyText}
              </div>
            </div>
            <div className="w-100 mt-2">
              <select name="category" id="content-category" multiple tabIndex={-1} data-ssid="ss-98647" aria-hidden="true" style={{ display: 'none' }} data-gtm-form-interact-field-id="0">
              </select>
              <div className='ss-98647 ss-main'>
                <div className='ss-multi-selected'>
                  <div className='ss-values'>
                    <span className='ss-disabled' onClick={handleClick}>Tag</span>
                  </div>
                  <div className='ss-add' onClick={handleClick}>
                    <BsPlus />
                  </div>
                </div>
                <div className='ss-content'> 
                  <div className={`ss-search${isSearchVisible ? ' visible' : ''}`}>
                    <input type='search' placeholder='Search' tabIndex={0} aria-label='Search' autoCapitalize='off' autoComplete='off' autoCorrect='off' onClick={() => console.log('Search input clicked')} />
                  </div>
                  <div className={`ss-list${isListVisible ? ' visible' : ''}`} role='listbox'></div>
                </div>
              </div>
            </div>
            <div id="article-helper" className="mt-2">
              <button type="button" id="add-image" className="btn btn-secondary">이미지 추가</button>{' '}
              <button type="button" id="add-file" className="btn btn-secondary" onClick={handleFile}>파일 추가</button>
            </div>
            <div id="article-file-container">
              {/* {articleFile.map((id, index) => ( //업로드 된 파일 목록
                <div id={`input-group-saved${index + 1}`} className="input-group my-1">
                  <input type="text" name={`article_file_${id}`} className="form-control article-file" value={name} readOnly />
                  <button type="button" className="input-group-text default-btn" onClick={() => article.deleteInput(`saved${index + 1}`)}><BsXLg /></button>
                </div>
              ))} */}
              {fileObj && Object.keys(fileObj).map((id) => ( //파일 추가 input
                <div key={`${id}`} id={`input-group-${id}`} className="input-group my-1">
                  <input type="file" id={`article-file-${id}`} name={`article_file_${id}`} className="form-control article-file"/>
                  <button type="button" className="input-group-text default-btn" onClick={() => deleteInput(`${id}`)}><BsXLg /></button>
                </div>
              ))}
            </div>
            {board.board_type === 'Recruit' && (
              <div id="period-setting" className="mt-3">
                <div className="d-flex">
                  <div id="date-label" className="p-date-label">모집 기간</div>
                  <div className="row flex-fill">
                    <div className="col-sm-6 d-flex">
                      <div id="date-label" className="p-date-label d-flex"><a>From</a></div>
                      <div id="PeriodPickerStart" InputGroup className="log-event" data-td-target-input="nearest" data-td-target-toggle="nearest">
                        <input type="text" id="PeriodPickerStartInput" className="form-control" data-td-target="#PeriodPickerStart" required/>
                        <span InputGroup className="text" data-td-target="#PeriodPickerStart" data-td-toggle="datetimepicker">
                          <span className="material-icons-outlined">
                            today
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="col-sm-6 d-flex">
                      <div id="date-label" className="p-date-label d-flex"><a>To</a></div>
                      <div id="PeriodPickerEnd" InputGroup className="log-event" data-td-target-input="nearest" data-td-target-toggle="nearest">
                        <input type="text" id="PeriodPickerEndInput" className="form-control" data-td-target="#PeriodPickerEnd" required/>
                        <span InputGroup className="text" data-td-target="#PeriodPickerEnd" data-td-toggle="datetimepicker">
                          <span className="material-icons-outlined">
                            event
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button id="end-button" type="button" className="btn btn-outline-light" onClick={() => setToDateEnd()}>마감</button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default ArticleEdit;