// 사용 X

const qnaList=[
    {
        q: '처음 배우는 언어',
        answer: [
            {a: '예제 따라서 차근차근 익힌다', factor:['S'], val:[31]},
            {a: '맨땅에 코딩해가며 알아간다', factor:['N'],val:[31]}
        ]

    },{
        q: '나의 코딩 음악 플레이리스트는?',
        answer: [
            {a: 'n월 n주차 탑 100', factor:['E'],val:[19]},
            {a: '나만 아는 숨은 명곡 playList', factor:['I'],val:[19]}
        ]

    },{
        q: '전공 과목 중간 평가를 고를 수 있다면?',
        answer: [
            {a: '시험', factor:['S'],val:[18]},
            {a: '과제', factor:['N'],val:[18]}
        ]

    },{
        q: '친구가 "나 우울해서 모니터 바꿀까봐"',
        answer: [
            {a: '요새 힘든가보다 내가 모니터 좀 잘 아니까 골라주자', factor:['T'],val:[33]}
            ,{a: '진짜 우울해보이네 맛있는 거 먹이고 달래야겠다', factor:['F'],val:[33]}
        ]

    },{
        q: '잠 깨러 카페에 왔다. 뭐 마실까?',
        answer: [
            {a: '늘 마시던 걸로 ..', factor:['J','I'],val:[20,11]}
            ,{a: '계절 한정 신메뉴? 이건 먹어봐야지', factor:['P','E'],val:[20,11]}
        ]

    },{
        q: '밤에 누워서 하는 생각',
        answer: [
            {a: '사람은 무엇으로 코딩하는가', factor:['N'],val:[34]}
            ,{a: '56 line에 있던 error code 1046 ...', factor:['S'],val:[34]}
        ]

    },{
        q: '평소에 연락 안하는 동기가 마감 1시간 전 "개발아, 과제 다했어?ㅠㅠ"',
        answer: [
            {a: '못본 척.. 1시간 뒤에 답장한다 "아 이제 봤네"', factor:['T'],val:[25]}
            ,{a: '나도 도움받을 일 있겠지 뭐. 공유해준다', factor:['F'],val:[25]}
        ]

    },{
        q: '알고리즘이 안 풀릴때',
        answer: [
            {a: '데스크톱 주변을 정리한다', factor:['J','S'],val:[19,10]}
            ,{a: '머리 속 짜놓은 일정을 정리한다', factor:['P','N'],val:[19,10]}
        ]

    },{
        q: '변수명 스타일',
        answer: [
            {a: '자유분방하게 i,j,result, square, thisisbuffer, beonsu…', factor:['N'],val:[17]}
            ,{a: '질서정연 data_fetcher, get_value, item_list…', factor:['S'],val:[17]}
        ]

    },{
        q: '심심한데 코딩이나 할까?',
        answer: [
            {a: '편하고 조용한 내 방', factor:['I'],val:[28]}
            ,{a: '동기들이 모여 있는 과방', factor:['E'],val:[28]}
        ]

    },{
        q: '준비중인 개인 프로젝트',
        answer: [
            {a: '상세한 스케쥴이 있어야 마음이 편안-', factor:['P'],val:[30]}
            ,{a: '일정은 그때그때 맞추고 일단 가보자고', factor:['J'],val:[30]}
        ]

    },{
        q: '동료 팀원들끼리 근무 끝나고 한 잔 어때?',
        answer: [
            {a: '나만 빠질 수 없지. 간다', factor:['E','F'],val:[24,12]}
            ,{a: '업무 시간이면 충분하다. 칼퇴', factor:['I','T'],val:[24,12]}
        ]

    },{
        q: '코딩 골든 아워',
        answer: [
            {a: '맑은 정신과 건강한 육신 낮 코딩', factor:['E'],val:[18]}
            ,{a: '남들이 꿈꾸는 시간에 두 눈 뜨고 밤 코딩', factor:['I'],val:[18]}
        ]

    },{
        q: 'To do list',
        answer: [
            {a: '업무/개인 일 할 일/진행 중 페이지 나눠 깔끔하게 정리', factor:['J'],val:[31]}
            ,{a: '약속이든 프로젝트든 급한 순서대로 한 장에 때려 넣기', factor:['P'],val:[31]}
        ]
    },{
        q: '나의 실수로 팀원의 작업을 날렸다. 하나만 보내야 한다면?',
        answer: [
            {a: '구구절절한 사과가 담긴 장문의 메세지', factor:['F'],val:[30]}
            ,{a: '아메리카노 한 잔 쿠폰', factor:['T'],val:[30]}
        ]
    }

]

const resultList=[
    {
        typeEng:'Dawn Breathe',
        typeKr:'새벽 숨',
        mbti:'ENTJ'
    },
    {
        typeEng:'Twilight',
        typeKr:'해 질 녘',
        mbti:'ENFJ'
    },
    {
        typeEng:'Morning Dew',
        typeKr:'아침 이슬',
        mbti:'ESFJ'
    },
    {
        typeEng:'Dune Line',
        typeKr:'사구선',
        mbti:'ESTJ'
    },
    {
        typeEng:'Lightning Flash',
        typeKr:'번개 섬광',
        mbti:'ESTP'
    },
    {
        typeEng:'Blinking Star',
        typeKr:'깜박이별',
        mbti:'ENTP'
    },
    {
        typeEng:'Rainbow Cloud',
        typeKr:'무지개 구름',
        mbti:'ENFP'
    },
    {
        typeEng:'Spring Breeze',
        typeKr:'봄바람',
        mbti:'ESFP'
    },
    {
        typeEng:'Deep Ocean',
        typeKr:'심해',
        mbti:'INTJ'
    },
    {
        typeEng:'Moon Light',
        typeKr:'달빛',
        mbti:'INFJ'
    },
    {
        typeEng:'Salt Lake',
        typeKr:'염수호',
        mbti:'ISFJ'
    },
    {
        typeEng:'Fog City',
        typeKr:'안개 도시',
        mbti:'ISTJ'
    },
    {
        typeEng:'Summer Shower',
        typeKr:'소나기',
        mbti:'ISTP'
    },
    {
        typeEng:'Blue Hour',
        typeKr:'여명 빛',
        mbti:'INTP'
    },
    {
        typeEng:'Snow Flake',
        typeKr:'눈송이',
        mbti:'INFP'
    },
    {
        typeEng:'Cherry Blossom',
        typeKr:'벚꽃',
        mbti:'ISFP'
    }
]

const descList=[
    [{descEng: 'Fluid ',
    descKr:'유연하며 '},
    {descEng: 'Steady ',
    descKr:'꾸준하며 '}],

    [{descEng: 'Cool-head ',
    descKr:'냉철한 이성의 '},
    {descEng: 'Warm-heart ',
    descKr:'따뜻한 마음씨의 '}],

    [{descEng: 'Creative ',
    descKr:'창의적인 '},
    {descEng: 'Efficient ',
    descKr:'효율적인 '}],

    [{descEng: 'Multiplayer',
    descKr:'협동가'},
    {descEng: 'Singleplayer',
    descKr:'자립가'}]
]