def get_type_test(type1, type2, type3, type4):
    code = ""
    code += "E" if type4 > 0 else "I"
    code += "N" if type3 > 0 else "S"
    code += "T" if type2 > 0 else "F"
    code += "P" if type1 > 0 else "J"
    # desc4 = ["Steady", "Fluid"]
    # desc3 = ["Cool-head", "Warm-heart"]
    # desc2 = ["Efficient", "Creative"]
    # desc1 = ["Multiplayer", "Singleplayer"]
    # descKR4 = ["꾸준하며", "유연하며"]
    # descKR3 = ["냉철한 이성의", "따뜻한 마음씨의"]
    # descKR2 = ["효율적인", "창의적인"]
    # descKR1 = ["협동가", "자립가"]

    # gbti_dict = {
    #     "ENFJ": {"code": "ENFJ", "nickname": "Twilight", "nicknameKR": "해 질 녘", "desc": " ".join([desc4[0], desc3[1], desc2[1], desc1[0]]), "descKR": " ".join([descKR4[0], descKR3[1], descKR2[1], descKR1[0]])},
    #     "INTJ": {"code": "INTJ", "nickname": "Deep Ocean", "nicknameKR": "심해", "desc": " ".join([desc4[0], desc3[0], desc2[1], desc1[1]]), "descKR": " ".join([descKR4[0], descKR3[0], descKR2[1], descKR1[1]])},
    #     "ESFJ": {"code": "ESFJ", "nickname": "Morning Dew", "nicknameKR": "아침 이슬", "desc": " ".join([desc4[0], desc3[1], desc2[0], desc1[0]]), "descKR": " ".join([descKR4[0], descKR3[1], descKR2[0], descKR1[0]])},
    #     "ISTJ": {"code": "ISTJ", "nickname": "Fog City", "nicknameKR": "안개 도시", "desc": " ".join([desc4[0], desc3[0], desc2[0], desc1[1]]), "descKR": " ".join([descKR4[0], descKR3[0], descKR2[0], descKR1[1]])},
    #     "ISTP": {"code": "ISTP", "nickname": "Summer Shower", "nicknameKR": "소나기", "desc": " ".join([desc4[1], desc3[0], desc2[0], desc1[1]]), "descKR": " ".join([descKR4[1], descKR3[0], descKR2[0], descKR1[1]])},
    #     "INFP": {"code": "INFP", "nickname": "Snowflake", "nicknameKR": "눈송이", "desc": " ".join([desc4[1], desc3[1], desc2[1], desc1[1]]), "descKR": " ".join([descKR4[1], descKR3[1], descKR2[1], descKR1[1]])},
    #     "ENFP": {"code": "ENFP", "nickname": "Rainbow Cloud", "nicknameKR": "무지개 구름", "desc": " ".join([desc4[1], desc3[1], desc2[1], desc1[0]]), "descKR": " ".join([descKR4[1], descKR3[1], descKR2[1], descKR1[0]])},
    #     "ISFJ": {"code": "ISFJ", "nickname": "Salt Lake", "nicknameKR": "염수호", "desc": " ".join([desc4[0], desc3[1], desc2[0], desc1[1]]), "descKR": " ".join([descKR4[0], descKR3[1], descKR2[0], descKR1[1]])},
    #     "INFJ": {"code": "INFJ", "nickname": "Moonlight", "nicknameKR": "달빛", "desc": " ".join([desc4[0], desc3[1], desc2[1], desc1[1]]), "descKR": " ".join([descKR4[0], descKR3[1], descKR2[1], descKR1[1]])},
    #     "ESFP": {"code": "ESFP", "nickname": "Spring Breeze", "nicknameKR": "봄바람", "desc": " ".join([desc4[1], desc3[1], desc2[0], desc1[0]]), "descKR": " ".join([descKR4[1], descKR3[1], descKR2[0], descKR1[0]])},
    #     "ISFP": {"code": "ISFP", "nickname": "Cherry Blossom", "nicknameKR": "벚꽃", "desc": " ".join([desc4[1], desc3[1], desc2[0], desc1[1]]), "descKR": " ".join([descKR4[1], descKR3[1], descKR2[0], descKR1[1]])},
    #     "ENTJ": {"code": "ENTJ", "nickname": "Dawn Breathe", "nicknameKR": "새벽 숨", "desc": " ".join([desc4[0], desc3[0], desc2[1], desc1[0]]), "descKR": " ".join([descKR4[0], descKR3[0], descKR2[1], descKR1[0]])},
    #     "INTP": {"code": "INTP", "nickname": "Blue Hour", "nicknameKR": "여명 빛", "desc": " ".join([desc4[1], desc3[0], desc2[1], desc1[1]]), "descKR": " ".join([descKR4[1], descKR3[0], descKR2[1], descKR1[1]])},
    #     "ESTJ": {"code": "ESTJ", "nickname": "Dune Line", "nicknameKR": "사구선", "desc": " ".join([desc4[0], desc3[0], desc2[0], desc1[0]]), "descKR": " ".join([descKR4[0], descKR3[0], descKR2[0], descKR1[0]])},
    #     "ESTP": {"code": "ESTP", "nickname": "Lightning Flash", "nicknameKR": "번개 섬광", "desc": " ".join([desc4[1], desc3[0], desc2[0], desc1[0]]), "descKR": " ".join([descKR4[1], descKR3[0], descKR2[0], descKR1[0]])},
    #     "ENTP": {"code": "ENTP", "nickname": "Blinking Star", "nicknameKR": "깜박이별", "desc": " ".join([desc4[1], desc3[0], desc2[1], desc1[0]]), "descKR": " ".join([descKR4[1], descKR3[0], descKR2[1], descKR1[0]])},
    # }

    gbti_dict = {
        "ENFJ": {"code": "ENFJ", "nickname": "Go", "nicknameKR": "모르면 간첩 인싸 재질", "desc": "요즘 가장 핫한 언어 하면 100명 중에 80명은 외쳐요! Go!", "descKR": "문과도 가능하다는 바로 그 언어! 구글의 프로그래밍 언어입니다. 2019년 설문조사 결과 연봉이 높은 프로그래밍 언어 TOP 5 중 하나였어요. 현재 전세계에서 가장 수요가 높은 언어 중 하나입니다. 심플하고 배우기 쉬워 몇 개의 컨셉만 배우면 바로 시작할 수 있어요.\n개발 속도와 실행 속도 둘 다 매우매우 빨라요. 구글, 유튜브, 넷플릭스, 드롭박스, 트위치, 우버, 트위터 등에서 사용하고 있고, 구글의 다운로드 서버가 Go 언어로 되어 있죠."},
        "INTJ": {"code": "INTJ", "nickname": "Assembly", "nicknameKR": "근본은 나야! 둘이 될 수 없어", "desc": "언어계의 근-본", "descKR": "컴퓨터 중심의 언어예요. 사용하기에는 불편하지만 컴퓨터가 처리하기에는 좋죠.\n어떤 언어도 어셈블리로 만든 프로그램보다 빠르게 실행될 수 없어요. 기계에 바로 명령을 내리는 것과 마찬가지이기 때문에 누구보다 빠르게 남들과는 다르게 기계를 제어할 수 있어요.\n매우 세밀하게 프로그래밍 해야 해요. 0과 1만을 사용하는 기계어와 가장 비슷하기 때문에 다른 언어보다 길게 적어야 하죠. 하드웨어의 원리를 잘 알고 있어야 해 배우기 어려워요."},
        "ESFJ": {"code": "ESFJ", "nickname": "Javascript", "nicknameKR": "유연하고 섬세한 마성의 발라더", "desc": "앱도 만들고, 웹도 만들고, 서버도 만들어요! 자며든다..", "descKR": "최근에 가장 인기 있는 언어 중 하나입니다. 빠르고 간단하게 프로그래밍 할 수 있어 초보자들이 쉽게 배우고 사용해요. 마성의 언어!\n웹 페이지의 동작을 책임지는 언어이다 보니 다른 플랫폼이나 운영체제에서도 문제 없이 사용되기 쉬운 형태입니다. 1타 N피! 가성비를 넘은 갓성비!\n여기저기 유연하게 어울리며, 융통성이 좋아요. 다만 너무 유연하다 보니 가독성이 떨어질 때도 있어요."},
        "ISTJ": {"code": "ISTJ", "nickname": "Typescript", "nicknameKR": "너 혹시... 뭐 돼? 자존감 TOP", "desc": "1번도 쓰지 않은 사람은 있어도 1번만 사용한 사람은 없다는 바로 그 언어!", "descKR": "2012년 마이크로소프트가 발표한 언어로 자바스크립트를 기반으로 하고 있어요. 프론트엔드 영역에서 필수 언어로 각광받고 있답니다.\n코드 작성 단계에서 타입을 체크하기 때문에 실수를 막을 수 있어요. 늘 매의 눈으로 코드를 체크하죠. 목적에 맞지 않는 타입의 변수나 함수는 에러를 발생시켜 사전에 버그를 제거해요.\n프로젝트의 규모가 크고 복잡할수록, 유지보수가 중요한 장기 프로젝트일수록 빛을 발해요.🌟"},
        "ISTP": {"code": "ISTP", "nickname": "C#", "nicknameKR": "기승전결 확실한 전교 1등 리더상", "desc": "시스템 개발부터 게임 개발까지 다양한 분야에서 대활약 중!", "descKR": "C라는 이름답게 C와 C++을 닮았어요. C++을 기반으로 자바의 장점을 합친 언어랍니다. 개발자가 사용하기 편한 인터페이스 환경으로 되어 있어요.\n초심자가 배우기 편한 친구예요. C로 100줄 작성해야 할 코드를 C#으로 작성하면 20줄로 끝날 정도로 간편해집니다.\n타입과 문법은 엄격해요. 사소한 실수도 따박따박 잡아내서 에러를 방지하죠. 자비 없는 느낌! 보통 게임 개발에 많이 사용합니다."},
        "INFP": {"code": "INFP", "nickname": "Dart", "nicknameKR": "조용히 강한 일잘러", "desc": "2011년 구글이 만든 언어!", "descKR": "다트는 몰라도 플러터는 아실 수 있을텐데요. 다트는 플러터와 뗄 수 없는 사이! 플러터는 다트를 사용하는 프레임워크예요. 다트를 알면 플러터를 개발할 수 있습니다.\n진입 장벽이 낮아요. C문법을 따르고 있어 개발자라면 대부분 익숙하게 다가갈 수 있습니다. 처음 배우는 분들에게도 부담이 적어요.\n웹 뿐만 아니라 데스크톱이나 모바일 앱까지 개발할 수 있어요.\n구조와 문법이 갖추어져 있지만 유연하기 때문에 쉽게 배울 수 있습니다."},
        "ENFP": {"code": "ENFP", "nickname": "Python", "nicknameKR": "단순명쾌 빠워긍정", "desc": "인싸 중에 인싸! 사랑둥이", "descKR": "파이썬은 초보 개발자들에게 가장 많이 사랑받는 언어입니다.\n호불호가 명확해 단순하고 명료한 코드 작성을 지향합니다. 문법이 쉽고 간결하지만, 기초 문법만 쉽다는 사실! 제대로 된 프로그래밍 언어이기 때문에 깊게 들어가면 어려워요.\n다른 소프트웨어와 궁합도 좋아 조합해서 강력한 프로그램을 만들 수 있죠. 웹 페이지, 서비스 개발, 데이터 분석, 딥러닝, 머신러닝 등 다양한 분야에서 활용돼요. 빠른 속도로 개발할 수 있고, 결과물도 빨리 나오는 편이죠."},
        "ISFJ": {"code": "ISFJ", "nickname": "C", "nicknameKR": "알잘딱깔센 프로일잘러", "desc": "'프로그래밍'하면 가장 먼저 떠올리는 언어!", "descKR": "무려 1970년대에 만들어졌지만 늘 프로그래밍 언어 인기 순위 탑! 전세계적으로 가장 많이 사용하고 있습니다. 모든 운영체제에서 지원하고 있기도 해 어딜가나 환영받는 유우-명인사예요.\n무엇이든 백 투 더 베이직! 기본에 충실해요. 사람보다 컴퓨터와 친한 C는 엄격한 문법을 가지고 있어 언어의 도움 없이 코드 간의 구동 원리를 깨우치는데 좋습니다.\n처음 배우기에는 어렵지만 익혀두면 다른 언어들과 친해지기 수월합니다."},
        "INFJ": {"code": "INFJ", "nickname": "Rust", "nicknameKR": "겉바속촉 완벽주의", "desc": "예외가 없기로 유명해요. ⚠안전제일⚠", "descKR": "2020년 스택오버플로우가 실시한 설문조사 결과 가장 사랑받는 언어 5년 연속 1위!\n자바스크립트나 파이썬과 비교하면 러스트의 문법은 굉장히 엄격해요. 초보자들이 배우기 쉽지 않지만 조금만 배우면 실력을 단번에 키울 수 있어요.\n친절하죠. 어느 부분이 잘못됐고, 어떻게 고쳐야 하는지 알려주니 겁먹을 필요는 없어요.\n메타의 암호화폐 리브라의 코어도 러스트로 구현되었어요. 장점은 속도! 동작 속도와 작성 속도 모두 빠른 언어예요."},
        "ESFP": {"code": "ESFP", "nickname": "Ruby", "nicknameKR": "자유로운 영혼", "desc": "간결함과 생산성을 강조한 언어!", "descKR": "누구나 쉽게 배울 수 있어요. 코드가 간단하기 때문이죠. 웹사이트를 쉽고 빠르게 만들 수 있어 간단한 사이트를 구축하거나 프로토타입을 만들 때 자주 이용해요. 빨리 무언가를 만드는 데에 루비만한 게 없기 때문이에요. 굉장히 효율적인 언어죠. 다만 대규모 서비스에서 이용하기에는 실행 속도가 느려요.\n대부분의 초기 스타트업 사이트나 트위터, Github이 루비로 만들어졌어요. 우리나라에서는 많이 이용하고 있지 않아 다른 언어에 비해 관련 자료를 찾기 어려울 수 있어요."},
        "ISFP": {"code": "ISFP", "nickname": "PHP", "nicknameKR": "다정다감 따수운 자상보스", "desc": "작은 프로젝트라면 적은 비용으로 최대 효율!", "descKR": "서버에서 실행되는 프로그래밍 언어로 웹 프로그래밍을 위한 언어예요. 직관적인 함수들이 많아 편하게 프로그래밍 할 수 있는 게 장점! 단, 어디까지나 간단한 사이트 제작을 위한 언어일 뿐 복잡한 기능을 많이 갖춰야 하는 사이트를 만들 때는 효율적이지 않아요.\n코드 작성이 쉽고 문법이 간단해요. C언어나 C++의 문법과 비슷해 효율적인 코딩이 가능하죠.\n배우기 쉬운 언어예요. 다른 프로그래밍 언어를 배운 경험이 있다면 쉽게 PHP를 GET할 수 있습니다. 경험이 없더라도 어렵지 않고요."},
        "ENTJ": {"code": "ENTJ", "nickname": "Kotlin", "nicknameKR": "내 심장의 색깔은 블랙 모던한 뉴요커", "desc": "장황하지 않고 깔끔한 코드 그 자체!", "descKR": "문법이 현대적이고 간결해요. 덕분에 유지보수를 편하게 할 수 있어요.\n코틀린은 자바보다 간결하고 생산적이며 안전한 대체 언어가 필요해 만들어졌어요. 자바에서 흔하게 발생하는 오류를 방지할 수 있어 안전하죠.\n주로 서버와 안드로이드 개발에 널리 사용되고 있어요.\n코틀린은 언어를 비롯해 관련된 모든 도구가 오픈소스로 공개되어 있어요. 누구나 무료로 사용할 수 있죠."},
        "INTP": {"code": "INTP", "nickname": "Java", "nicknameKR": "무심한 듯 다정한 츤데레", "desc": "요새 개발자라면 자바 안 배우는 사람 없죠!", "descKR": "쉬운 편은 아니지만 인기가 많아요.\n70년대에 나왔던 C언어에서 사용성이 개선된 언어라 많은 사랑을 받고 있어요.\n눈앞에 보이는 화면 말고, 무심한 듯 시크하게 뒤에서 지원해 주는 프로그램을 만드는 데 유용해요.\n안드로이드 앱과 서버 개발에 특히 많이 쓰이고 있고, 틀이 잘 갖춰져 있어 협업할 때 적합한 언어입니다.\n규모가 큰 서비스에 어울리죠."},
        "ESTJ": {"code": "ESTJ", "nickname": "R", "nicknameKR": "완벽.. 빈틈없는 벽이 느껴져..", "desc": "배우고 아는 만큼 멋진 결과를 낼 수 있죠!", "descKR": "통계 분석을 위해 만들어진 언어인 만큼 데이터 과학자들이 선호하는 언어예요. 통계 분석과 그래프 형태의 시각화가 강점! 처음에는 일부 통계학자들만 사용했지만, 지금은 구글, 아마존 등에서 데이터 기본 분석 플랫폼으로 널리 사용하고 있어요.\n통계 계산 등에 활용할 수 있는 패키지 생태계가 강력해 함수 묶음을 설치만 하면 다양한 기능을 사용할 수 있습니다. 사용자 간에 다양한 정보를 공유할 수 있는 사이트도 많아요. 설치와 사용 환경 구축도 쉽고요!"},
        "ESTP": {"code": "ESTP", "nickname": "C++", "nicknameKR": "고민보다 GO! 행동 대장", "desc": "수많은 언어들을 위한 든든한 기초 언어!", "descKR": "C++은 C언어의 단점을 보완한 언어입니다. 이름 그대로 C에서 ++!\n구글, 크롬, 파이어폭스, 마이크로소프트 워드, 엑셀, 파워포인트 모두 C++로 개발했어요.\n큼직큼직한 응용프로그램을 만들 수 있어 대형 게임을 만들 때 사용해요. 게임 개발 분야에 취업하고 싶다면 필수로 배워야 할 언어죠.\n초보자에게는 진입 장벽이 높아요. 많은 기능이 있어 코드를 작성하는 게 간단하지 않기 때문입니다."},
        "ENTP": {"code": "ENTP", "nickname": "Swift", "nicknameKR": "마이웨이 힙스터", "desc": "개발자들이 원하던 현대적이고 세련된 HIP한 문법의 소유자!", "descKR": "애플이 2014년 공개한 언어예요. iOS, macOS, watchOS 등 애플 플랫폼에 최적화되어 있습니다. 읽고 쓰기 쉬운 문법으로 구성되어 있어요.\n무엇이든 빠릿빠릿! 속도가 무척 빠른 언어입니다. 엄격한 문법을 적용해 프로그래밍 도중에 저지를 수 있는 실수를 방지하고 있어요. 자칭 트렌드 세터로 업데이트도 꾸준히 진행되고 있는 언어라 더욱 쓰기 좋게 발전해나갈 예정이에요."},
    }

    gbti_combi_dict = {
        "ENFJ": {"pos": "INFP", "neg": "ISTJ"},
        "INTJ": {"pos": "ENTP", "neg": "ESFJ"},
        "ESFJ": {"pos": "ISFP", "neg": "INTJ"},
        "ISTJ": {"pos": "ESTP", "neg": "ENFJ"},
        "ISTP": {"pos": "ESTJ", "neg": "ENFP"},
        "INFP": {"pos": "ENFJ", "neg": "ESTP"},
        "ENFP": {"pos": "INFJ", "neg": "ISTP"},
        "ISFJ": {"pos": "ESFP", "neg": "ENTJ"},
        "INFJ": {"pos": "ENFP", "neg": "ESTJ"},
        "ESFP": {"pos": "ISFJ", "neg": "INTP"},
        "ISFP": {"pos": "ESFJ", "neg": "ENTP"},
        "ENTJ": {"pos": "INTP", "neg": "ISFJ"},
        "INTP": {"pos": "ENTJ", "neg": "ESFP"},
        "ESTJ": {"pos": "ISTP", "neg": "INFJ"},
        "ESTP": {"pos": "ISTJ", "neg": "INFP"},
        "ENTP": {"pos": "INTJ", "neg": "ISFP"},
    }
    pos_code = gbti_combi_dict[code]["pos"]
    neg_code = gbti_combi_dict[code]["neg"]

    gbti_dict[code]["pos"] = gbti_dict[pos_code]
    gbti_dict[code]["neg"] = gbti_dict[neg_code]
    return gbti_dict[code]


def get_type_analysis(type_list):
    label = [
        ["Sunflower", "Night Owl"],
        ["Initiator", "Evergreen", "Burning"],
        ["Together", "Independent"]
    ]
    desc = [
        ["주로 낮에 활동합니다.", "주로 밤에 활동합니다."],
        ["프로젝트 초반에 주로 활약합니다.", "프로젝트에 전반적으로 활약합니다.", "프로젝트 후반에 주로 활약합니다."],
        ["함께 작업하는 편입니다.", "혼자서 작업하는 편입니다."]
    ]
    color = [
        ["#FFA500", "#2B2B52", ],
        ["#FFD700", "#228B22 ", "#FF4500"],
        ["#7184E4", "#F5DEB3"]
    ]

    def get_type(idx:int, n:int, crtr=[0]):
        if n == 2:
            if type_list[idx] < crtr[0]:
                obj = {'label': label[idx][0],
                       'desc': desc[idx][0], 'color': color[idx][0]}
            else:
                obj = {'label': label[idx][1],
                       'desc': desc[idx][1], 'color': color[idx][1]}
        elif n == 3:
            if type_list[idx] < crtr[0]:
                obj = {'label': label[idx][0],
                       'desc': desc[idx][0], 'color': color[idx][0]}
            elif type_list[idx] < crtr[1]:
                obj = {'label': label[idx][1],
                       'desc': desc[idx][1], 'color': color[idx][1]}
            else:
                obj = {'label': label[idx][2],
                       'desc': desc[idx][2], 'color': color[idx][2]}
        return obj

    results = []
    results.append(get_type(0, 2, [0]))
    results.append(get_type(1, 3, [-0.4, 0.4]))
    results.append(get_type(2, 2, [0]))

    return results



def get_dtype(type1, type2, type3, type4):
    code = ""
    code += "E" if type4 > 0 else "I"
    code += "N" if type3 > 0 else "S"
    code += "T" if type2 > 0 else "F"
    code += "P" if type1 > 0 else "J"
    return code

def get_dtype_statistics(dtypes):
    data = {"ENFJ": {"total":0, "nicknameKR": "해 질 녘"},
        "INTJ": {"total":0, "nicknameKR": "심해"},
        "ESFJ": {"total":0, "nicknameKR": "아침 이슬"},
        "ISTJ": {"total":0, "nicknameKR": "안개 도시"},
        "ISTP": {"total":0, "nicknameKR": "소나기"},
        "INFP": {"total":0, "nicknameKR": "눈송이"},
        "ENFP": {"total":0, "nicknameKR": "무지개 구름"},
        "ISFJ": {"total":0, "nicknameKR": "염수호"},
        "INFJ": {"total":0, "nicknameKR": "달빛"},
        "ESFP": {"total":0, "nicknameKR": "봄바람"},
        "ISFP": {"total":0, "nicknameKR": "벚꽃"},
        "ENTJ": {"total":0, "nicknameKR": "새벽 숨"},
        "INTP": {"total":0, "nicknameKR": "여명 빛"},
        "ESTJ": {"total":0, "nicknameKR": "사구선"},
        "ESTP": {"total":0, "nicknameKR": "번개 섬광"},
        "ENTP": {"total":0, "nicknameKR": "깜박이별"},}
    
    for dtype in dtypes:
        data[get_dtype(dtype.typeA, dtype.typeB, dtype.typeC, dtype.typeD)]["total"]+=1

    return data