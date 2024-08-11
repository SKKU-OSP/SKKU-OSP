import axios from 'axios';
import MainBoard_Presenter from './MainBoard_Presenter';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsCircle, BsCircleFill } from 'react-icons/bs';

const server_url = import.meta.env.VITE_SERVER_URL;

export default function Board_Container() {
  const navigate = useNavigate();
  const [promotionImages, setPromotionImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const getImage = async () => {
    try {
      const response = await axios.get(server_url + `/community/api/heroes/`);
      const res = response.data;

      if (res.status === 'success') {
        const promotionImages = res.data.hero_articles.map((heroArticle) => {
          const file_url = `${server_url}${heroArticle.thumbnail.file}`;
          return { src: file_url, id: heroArticle.article_id };
        });

        setPromotionImages(promotionImages);
      } else {
        alert('홍보 이미지를 불러올 수 없습니다.');
      }
    } catch (error) {
      setError(true);
    }
  };
  console.log(promotionImages);

  useEffect(() => {
    getImage(); // 홍보 이미지 불러오기
    const interval = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage + 1) % promotionImages.length);
    }, 5000); // 5초마다 페이지 넘김

    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, [promotionImages.length]);

  const renderPageIndicators = (currentPage) => {
    let indicators = [];
    for (let i = 0; i < promotionImages.length; i++) {
      indicators.push(i === currentPage ? <BsCircleFill key={i} size={8} /> : <BsCircle key={i} size={8} />);
    }
    return indicators;
  };

  const handlePrevClick = () => {
    setCurrentPage((prev) => (prev === 0 ? promotionImages.length - 1 : prev - 1));
  };

  const handleNextClick = () => {
    setCurrentPage((prev) => (prev + 1) % promotionImages.length);
  };

  return (
    <MainBoard_Presenter
      currentPage={currentPage}
      promotionImages={promotionImages}
      handlePrevClick={handlePrevClick}
      handleNextClick={handleNextClick}
      renderPageIndicators={renderPageIndicators}
    />
  );
}
