import React, { useState } from 'react';
import QnAArticle from './QnaArticle';
import '../User.css';

const QnAList_Presenter = ({ qnas }) => {
  const [selectedQna, setSelectedQna] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const options = [
    { value: 'inquiry', label: '이용 문의' },
    { value: 'bug', label: '오류 신고' },
    { value: 'suggestion', label: '서비스 제안' },
    { value: 'other', label: '기타' }
  ];

  const getTypeLabel = (type) => {
    const option = options.find((option) => option.value === type);
    return option ? option.label : type;
  };

  const handleItemClick = (qna) => {
    setSelectedQna(qna);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedQna(null);
  };

  return (
    <div className="mx-5 px-5">
      <div className="qna-nav">
        <ul className="nav">
          <li className="nav-item selected-nav-item">
            <div>문의 목록</div>
          </li>
        </ul>
      </div>
      <div>
        <div className="qna-divider" style={{ height: '2px' }}></div>
        <div className="d-flex qna-header">
          <div className="qna-no">No</div>
          <div className="qna-type">유형</div>
          <div className="qna-content">내용</div>
          <div className="qna-writer">작성자</div>
          <div className="qna-time">작성시간</div>
          <div className="qna-ans">해결여부</div>
        </div>
        <div className="divider"></div>
        {qnas.map((qna, index) => (
          <div
            className="d-flex qna-item"
            key={index}
            onClick={() => handleItemClick(qna)}
            style={{ cursor: 'pointer' }}
          >
            <div className="qna-no">{qna.id}</div>
            <div className="qna-type">{getTypeLabel(qna.type)}</div>
            <div className="qna-content">{qna.content}</div>
            <div className="qna-writer">{qna.user}</div>
            <div className="qna-time">{new Date(qna.created_at).toLocaleDateString('ko-KR')}</div>
            <div className="qna-ans">{qna.solved ? '완료' : '미완료'}</div>
          </div>
        ))}
      </div>
      {selectedQna && <QnAArticle qna={selectedQna} Show={showModal} handleClose={handleClose} />}
    </div>
  );
};

export default QnAList_Presenter;
