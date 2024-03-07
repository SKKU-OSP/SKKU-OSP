import MainBoard_Presenter from './MainBoard_Presenter';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsCircle, BsCircleFill } from 'react-icons/bs';

export default function Board_Container() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage >= 5 ? 1 : prevPage + 1));
    }, 5000); // 5초마다 페이지 넘김

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);

  const renderPageIndicators = (currentPage) => {
    let indicators = [];
    for (let i = 1; i <= 5; i++) {
      indicators.push(i === currentPage ? <BsCircleFill key={i} size={8} /> : <BsCircle key={i} size={8} />);
    }
    return indicators;
  };

  const handlePrevClick = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextClick = () => {
    setCurrentPage((prev) => Math.min(prev + 1, 5));
  };

  return (
    <MainBoard_Presenter
      currentPage={currentPage}
      handlePrevClick={handlePrevClick}
      handleNextClick={handleNextClick}
      renderPageIndicators={renderPageIndicators}
    />
  );
}
