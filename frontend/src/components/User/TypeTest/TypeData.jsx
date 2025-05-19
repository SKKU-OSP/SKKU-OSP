const qnaList = [
  {
    q: '😓 입사 안내를 기다리는 중! 신규 입사자들이 쭈뼛쭈뼛 모여 있다',
    answer: [
      { a: '입사 동기인가? 먼저 말 걸어봐야지', factor: ['E'], val: [33] },
      { a: '너무 어색행~ 누가 먼저 말 안 걸어주나?', factor: ['I'], val: [33] }
    ]
  },
  {
    q: '🍔 기다리던 점심 시간 밥 먹고 뭘 하면서 쉴까?',
    answer: [
      { a: '혼자 책을 읽거나 잠을 잔다', factor: ['I'], val: [33] },
      { a: '팀원들과 수다를 떤다', factor: ['E'], val: [33] }
    ]
  },
  {
    q: '🍺 첫 출근 기념으로 친구와 잡았던 저녁 약속이 취소됐다',
    answer: [
      { a: '피곤했는데 잘 됐다~ 집에서 쉰다', factor: ['I'], val: [33] },
      { a: '안 돼! 다른 친구에게 바로 연락한다', factor: ['E'], val: [33] }
    ]
  },
  {
    q: '📑 업무 가이드 문서를 받았는데 분량이 상당하다',
    answer: [
      { a: '처음부터 한 자 한 자 꼼꼼하게 읽는다', factor: ['N'], val: [33] },
      { a: '휘리릭 넘기며 궁금한 것부터 살펴본다', factor: ['S'], val: [33] }
    ]
  },
  {
    q: '🗓 오늘은 무슨 일을 할까?',
    answer: [
      { a: '신기능을 구상하는 과제', factor: ['S'], val: [33] },
      { a: '기존 기능을 보완하는 과제', factor: ['N'], val: [33] }
    ]
  },
  {
    q: '💭 옆 자리 동기가 밸런스 게임을 제안한다. “팔만대장경 읽기 VS 대장 내시경 8만 번 하기',
    answer: [
      { a: '아~ 안 해요', factor: ['S'], val: [33] },
      { a: '수면 내시경이에요? 금식해야 돼요?', factor: ['N'], val: [33] }
    ]
  },
  {
    q: '🎁 취업 기념 선물로 받고 싶은 건?',
    answer: [
      { a: '예쁘고 기억에 남을만한 것', factor: ['F'], val: [33] },
      { a: '요즘 가장 필요한 것', factor: ['T'], val: [33] }
    ]
  },
  {
    q: '💦 내 의견과 팀원들의 의견이 다르다. 어떻게 하지?',
    answer: [
      { a: '기분 상하지 않게 설득해 봐야지', factor: ['F'], val: [33] },
      { a: '논리적으로 설득해 봐야지', factor: ['T'], val: [33] }
    ]
  },
  {
    q: '👭 힘든 일이 생겼을 때 가장 먼저 찾게 되는 동료는?',
    answer: [
      { a: '현실적인 조언을 해주는 동료', factor: ['T'], val: [33] },
      { a: '위로와 공감을 해주는 동료', factor: ['F'], val: [33] }
    ]
  },
  {
    q: '💪 드디어 첫 업무를 시작한다. 가장 먼저 할 일은?',
    answer: [
      { a: '어떤 일을 언제까지 할지 계획부터 짠다', factor: ['J'], val: [33] },
      { a: '시작이 반이다! 일단 자료조사부터 한다', factor: ['P'], val: [33] }
    ]
  },
  {
    q: '🤸‍♂️ 기다리던 퇴근 시간! 마지막으로 할 일은?',
    answer: [
      { a: '자리만 슥삭 정리한다', factor: ['P'], val: [33] },
      { a: '내일 할 일을 적어둔다', factor: ['J'], val: [33] }
    ]
  },
  {
    q: '🤔 저녁을 먹으려고 했던 가게가 문을 닫았다',
    answer: [
      { a: '그럴 줄 알고 한두 군데 더 찾아뒀다', factor: ['J'], val: [33] },
      { a: '오다가 본 다른 가게에 가자고 제안한다', factor: ['P'], val: [33] }
    ]
  }
  // ,{
  //   q: '코딩 골든 아워',
  //   answer: [
  //     { a: '맑은 정신과 건강한 육신 낮 코딩', factor: ['E'], val: [0] },
  //     { a: '남들이 꿈꾸는 시간에 두 눈 뜨고 밤 코딩', factor: ['I'], val: [0] }
  //   ]
  // },
  // {
  //   q: 'To do list',
  //   answer: [
  //     { a: '업무/개인 일 할 일/진행 중 페이지 나눠 깔끔하게 정리', factor: ['J'], val: [0] },
  //     { a: '약속이든 프로젝트든 급한 순서대로 한 장에 때려 넣기', factor: ['P'], val: [0] }
  //   ]
  // },
  // {
  //   q: '나의 실수로 팀원의 작업을 날렸다. 하나만 보내야 한다면?',
  //   answer: [
  //     { a: '구구절절한 사과가 담긴 장문의 메세지', factor: ['F'], val: [0] },
  //     { a: '아메리카노 한 잔 쿠폰', factor: ['T'], val: [0] }
  //   ]
  // }
];

const resultList = [
  {
    typeEng: 'Kotlin',
    typeKr: '내 심장의 색깔은 블랙 모던한 뉴요커',
    mbti: 'ENTJ'
  },
  {
    typeEng: 'Go',
    typeKr: '모르면 간첩 인싸 재질',
    mbti: 'ENFJ'
  },
  {
    typeEng: 'JavaScript',
    typeKr: '유연하고 섬세한 마성의 발라더',
    mbti: 'ESFJ'
  },
  {
    typeEng: 'R',
    typeKr: '완벽.. 빈틈없는 벽이 느껴져..',
    mbti: 'ESTJ'
  },
  {
    typeEng: 'C++',
    typeKr: '고민보다 GO! 행동 대장',
    mbti: 'ESTP'
  },
  {
    typeEng: 'Swift',
    typeKr: '마이웨이 힙스터',
    mbti: 'ENTP'
  },
  {
    typeEng: 'Python',
    typeKr: '단순명쾌 빠워긍정',
    mbti: 'ENFP'
  },
  {
    typeEng: 'Ruby',
    typeKr: '자유로운 영혼',
    mbti: 'ESFP'
  },
  {
    typeEng: 'Assembly',
    typeKr: '근본은 나야! 둘이 될 수 없어',
    mbti: 'INTJ'
  },
  {
    typeEng: 'Rust',
    typeKr: '겉바속촉 완벽주의',
    mbti: 'INFJ'
  },
  {
    typeEng: 'C',
    typeKr: '알잘딱깔쎈 프로일잘러',
    mbti: 'ISFJ'
  },
  {
    typeEng: 'TypeScript',
    typeKr: '너 혹시… 뭐 돼? 자존감 TOP',
    mbti: 'ISTJ'
  },
  {
    typeEng: 'C#',
    typeKr: '기승전결 확실한 전교 1등 리더상',
    mbti: 'ISTP'
  },
  {
    typeEng: 'Java',
    typeKr: '무심한 듯 다정한 츤데레',
    mbti: 'INTP'
  },
  {
    typeEng: 'Dart',
    typeKr: '조용히 강한 일잘러',
    mbti: 'INFP'
  },
  {
    typeEng: 'PHP',
    typeKr: '다정다감 따수운 자상보스',
    mbti: 'ISFP'
  }
];

const descList = [
  [
    { descEng: 'Fluid ', descKr: '유연하며 ' },
    { descEng: 'Steady ', descKr: '꾸준하며 ' }
  ],

  [
    { descEng: 'Cool-head ', descKr: '냉철한 이성의 ' },
    { descEng: 'Warm-heart ', descKr: '따뜻한 마음씨의 ' }
  ],

  [
    { descEng: 'Creative ', descKr: '창의적인 ' },
    { descEng: 'Efficient ', descKr: '효율적인 ' }
  ],

  [
    { descEng: 'Multiplayer', descKr: '협동가' },
    { descEng: 'Singleplayer', descKr: '자립가' }
  ]
];

export { qnaList, descList, resultList };
