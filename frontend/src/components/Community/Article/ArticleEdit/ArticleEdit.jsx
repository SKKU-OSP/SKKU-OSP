import React, { useEffect, useState, useRef } from 'react';
import { BsXLg, BsSave } from "react-icons/bs";
import { Button } from 'react-bootstrap';
import axios from 'axios'
import Select from 'react-select'

import './ArticleEdit.css';
import { useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
/**
 * TARGET: content-edit.html
 */
const domainUrl = import.meta.env.VITE_SERVER_URL


function ArticleEdit({ isWrite, type, board = {}, typeKr, consentWriteOpen }) {
  const articleID = useParams().article_id
  const url = domainUrl + "/community/api/article/" + articleID
  const urlTag = domainUrl + "/tag/api/list/"

  const article = {}
  const [isAuthNotice, setIsAuthNotice] = useState(true);
  const [anonymousWriter, setAnonymousWriter] = useState(true);
  const [numFile, setNumFile] = useState(0);
  const [fileObj, setFileObj] = useState({});
  const [articleFile, setArticleFile] = useState([]);
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [tags, setTags] = useState([]);
  const [selectTags, setSelectTags] = useState([]);
  const editorRef = useRef(null);

  useEffect(() => { //axios 사용
    const getArticle = async() => {
      const response = await axios.get(url);
      const responseTag = await axios.get(urlTag);
      const res = response.data;
      const resTag = responseTag.data;
      if(res.status === "success"){
        setTitle(res.data.article.title);
        setBodyText(res.data.article.body);
        setTags(resTag.data.tags.map(t => {
          return{
            value: t.name, label: t.name, color: t.color
          }
        }));
        setSelectTags(res.data.tags.map(t => {
          return{
            value: t.name, label: t.name, color: t.color
          }
        }));
        setIsAuthNotice(res.data.article.is_notice);
        setAnonymousWriter(res.data.article.anonymous_writer);
      }
      else{console.log(res.message)}
    }
    getArticle()
  }, [])

  // 공지 체크 여부 확인
  const noticeCheck = () => {
    return isAuthNotice;
  };

  // 익명 체크 여부 확인
  const anonymousCheck = () => {
    return anonymousWriter;
  };

  // 저장 버튼 클릭 시
  const handleShow = async() => {
    if (title.trim() === "") {
      window.alert('제목을 입력해 주세요');
    }
    // else if (bodyText.text().trim().length === 0) {
    //     window.alert('본문을 입력해 주세요');
    // }
    else if (window.confirm("글을 수정하시겠습니까?")) { // 수정한 글 저장
      if (editorRef.current) {
        const modifiedContent = editorRef.current.getContent();
        
        const response = await axios.post(url, {
          type: "POST",
          content: modifiedContent,
          title: res.data.article.title,
          bodyText: res.data.article.body,
          tags: res.data.tags
        });
        const res = response.data;

        console.log(res);
      }
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleBodyChange = (e) => {
    setBodyText(e.target.value);

    console.log(e.target.value);
  };

  const handleEditorInit = (editor) => {
    console.log(editor);
    editorRef.current.value = bodyText;
    return(editorRef.current = editor)
  };

  const handleFile = () => {
    const nextNum = numFile + 1;
    
    setFileObj((prev) => {
      const prevObj = {...prev};
      prevObj[nextNum] = nextNum;
      return prevObj
    });
    setArticleFile((prev) => [...prev, prev.length + 1]);//키 값 줄일 떄 주의점 numFile 줄이면 안돼!!
    setNumFile(nextNum);
  }

  console.log(Object.keys({temp:1}))

  const inputRef = useRef<HTMLInputElement>(null);

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
      background: 'none',
    }),
    multiValue: (provided, state) => {
      const tagColor = state.data.color;
      return {
        ...provided,
        backgroundColor: tagColor,
      };
    },
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
            {isAuthNotice && ( //여기 수정해야 돼
              <div className="p-board-title">
                  <input type="checkbox" id="is-notice" className="align-middle" checked={noticeCheck()} />{' '}
                <label htmlFor="is-notice">공지1</label>
              </div>
            )}
            <div className="p-board-title">
                <input type="checkbox" id="is-notice" className="align-middle" checked={noticeCheck()} />{' '}
              <label htmlFor="is-notice">공지2</label>
            </div>
            {anonymousWriter && ( //여기 수정해야 돼
              <div className="p-board-title">
                  <input type="checkbox" id="is-anonymous" className="align-middle" checked={anonymousCheck()} />{' '}
                <label htmlFor="is-anonymous">익명1</label>
              </div>
            )}
            {anonymousWriter ? (
              <div className="p-board-title">
                <input type="checkbox" id="is-anonymous" className="align-middle" checked={true} />{' '}
                <label htmlFor="is-anonymous">익명2</label>
              </div>
            ) : (
              <div className="p-board-title">
                <input type="checkbox" id="is-anonymous" className="align-middle" checked={false} onChange={anonymousCheck} />{' '}
                <label htmlFor="is-anonymous">익명3</label>
              </div>
            )}
            <Button variant="transparent" onClick={handleShow} type="button" id="btn-content-edit" className="btn btn-outline-light">
              <BsSave /> 저장 {typeKr}
            </Button>
          </div>
        </div>
        <form id="article-form" method="post" data-edit-type={type} encType="multipart/form-data">
          {/* <input type="hidden" id="board-type" className="board_type" value={board.board_type} />
          <input type="hidden" id="board-name" className="board_name" value={board.name} />
          <input type="hidden" id="board-id" className="board_id" value={board.id} />
          <input type="hidden" id="article-id" className="article_id" value={article.id} />
          {board.board_type === 'Team' && 
            <input type="hidden" id="team-id" className="team_id" value={board.team.id} />
          } */}
          <div className="d-flex flex-column border border-2">
            <div className="d-flex justify-content-between mb-1">
              <input type="text" id="article-title" name="title" className="form-control" value={title} placeholder="제목을 입력해 주세요" required autofocus onChange={handleTitleChange} />
              {board.board_type === 'Recruit' && (
                <>
                  {team ? (
                    <Select id="team-option" name="team-option" className="form-select pointer" disabled>
                      <option value={team.id} selected>{team.name}</option>
                    </Select>
                  ) : type === 'register' ? (
                    <Select id="team-option" name="team-option" className="form-select pointer" required>
                      {teamOptions(request.user)}
                    </Select>
                  ) : (
                    <Select id="team-option" name="team-option" className="form-select pointer" disabled>
                      <option value={article.team.id} selected>{article.team.name}</option>
                    </Select>
                  )}
                </>
              )}
            </div>
            <div className="mt-2">
              {/* <div id="article-body" className="form-control block-article" contentEditable="true" onChange={handleBodyChange}>
                {bodyText}
              </div> */}
              <Editor onInit={handleEditorInit} onChange={handleBodyChange} />
            </div>
            <div className="w-100 mt-2">
            <Select placeholder={'Tag'} options={tags} isMulti menuPlacement="auto" value={selectTags} onChange={handleOptionSelect} closeMenuOnSelect={false} hideSelectedOptions={false} styles={customStyles} />
            </div>
            <div id="article-helper" className="mt-2">
              <button type="button" id="add-file" className="btn btn-secondary" onClick={handleFile}>파일 추가</button>
            </div>
            <div id="article-file-container">
              {/* {articleFile.map((id, index) => ( //업로드 된 파일 목록
                <div id={`input-group-saved${index + 1}`} className="input-group my-1">
                  <input type="text" name={`article_file_${id}`} className="form-control article-file" value={name} readOnly />
                  <button type="button" className="input-group-text default-btn" onClick={() => deleteInput(`saved${index + 1}`)}><BsXLg /></button>
                </div>
              ))} */}
              {fileObj && Object.keys(fileObj).map((id) => ( //파일 추가 input
                <div key={`${id}`} id={`input-group-${id}`} className="input-group my-1">
                  <input type="file" id={`article-file-${id}`} name={`article_file_${id}`} className="form-control article-file"/>
                  <button type="button" className="input-group-text default-btn" onClick={() => deleteInput(id)}><BsXLg /></button>
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
