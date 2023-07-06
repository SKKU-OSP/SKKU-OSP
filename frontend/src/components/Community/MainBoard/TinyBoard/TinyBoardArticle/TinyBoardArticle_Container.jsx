import TinyBoardArticle_Presenter from './TinyBoardArticle_Presenter';
import React, { useEffect, useState } from 'react';

export default function TinyBoardArticle_Container(props) {
  const { article, board_id } = props;

  const [isRecruit, setIsRecruit] = useState(false);
  const [isRecruitStarted, setIsRecruitStarted] = useState(false);
  const [isRecruitEnded, setIsRecruitEnded] = useState(false);

  useEffect(() => {
    if (board_id == 2) {
      setIsRecruit(true);
    }

    setIsRecruitStarted(true);
    setIsRecruitEnded(true);
  });

  return (
    <TinyBoardArticle_Presenter
      isRecruit={isRecruit}
      isRecruitStarted={isRecruitStarted}
      isRecruitEnded={isRecruitEnded}
    />
  );
}
