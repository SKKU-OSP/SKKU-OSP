def getGBTI(type1, type2, type3, type4):
    code, desc, descKR = "","",""
    code += "E" if type1 > 0 else "I"
    code += "S" if type2 > 0 else "N"
    code += "T" if type3 > 0 else "F"
    code += "J" if type4 > 0 else "P"
    desc4 = ["Steady", "Fluid"]
    desc3 = ["Cool-head", "Warm-heart"]
    desc2 = ["Efficient", "Creative"]
    desc1 = ["Multiplayer", "Singleplayer"]
    descKR4 = ["꾸준하며", "유연하며"]
    descKR3 = ["냉철한 이성의", "따뜻한 마음씨의"]
    descKR2 = ["효율적인", "창의적인"]
    descKR1 = ["협동가", "자립가"]
    (desc, descKR) = (desc+"Steady",descKR+"꾸준하며") if type4 > 0 else (desc+"Fluid",descKR+"유연하며")
    (desc, descKR) = (desc+" Cool-head",descKR+" 냉철한 이성의") if type3 > 0 else (desc+" Warm-heart",descKR+" 따뜻한 마음씨의")
    (desc, descKR) = (desc+" Efficient",descKR+" 효율적인") if type2 > 0 else (desc+" Creative",descKR+" 창의적인")
    (desc, descKR) = (desc+" Multiplayer",descKR+" 협동가") if type1 > 0 else (desc+" Singleplayer",descKR+" 자립가")
    print(code, desc, descKR)
    gbti_dict = {
        "ENFJ":{"code":"ENFJ", "nickname":"twilight", "nicknameKR":"해 질 녘", "desc":" ".join([desc4[0], desc3[1], desc2[1], desc1[0]]), "descKR":" ".join([descKR4[0], descKR3[1], descKR2[1], descKR1[0]])},
        "INTJ":{"code":"INTJ", "nickname":"deep_ocean", "nicknameKR":"심해", "desc":" ".join([desc4[1], desc3[1], desc2[0], desc1[0]]), "descKR":" ".join([descKR4[1], descKR3[1], descKR2[0], descKR1[0]])},
        "ESFJ":{"code":"ESFJ", "nickname":"morning_dew", "nicknameKR":"아침 이슬", "desc":" ".join([desc4[0], desc3[0], desc2[1], desc1[0]]), "descKR":" ".join([descKR4[0], descKR3[0], descKR2[1], descKR1[0]])},
        "ISTJ":{"code":"ISTJ", "nickname":"fog_city", "nicknameKR":"안개 도시", "desc":" ".join([desc4[1], desc3[0], desc2[0], desc1[0]]), "descKR":" ".join([descKR4[1], descKR3[0], descKR2[0], descKR1[0]])},
        "ISTP":{"code":"ISTP", "nickname":"summer_shower", "nicknameKR":"소나기", "desc":" ".join([desc4[1], desc3[0], desc2[0], desc1[1]]), "descKR":" ".join([descKR4[1], descKR3[0], descKR2[0], descKR1[1]])},
        "INFP":{"code":"INFP", "nickname":"snowflake", "nicknameKR":"눈송이", "desc":" ".join([desc4[1], desc3[1], desc2[1], desc1[1]]), "descKR":" ".join([descKR4[1], descKR3[1], descKR2[1], descKR1[1]])},
        "ENFP":{"code":"ENFP", "nickname":"rainbow_cloud", "nicknameKR":"무지개 구름", "desc":" ".join([desc4[0], desc3[1], desc2[1], desc1[1]]), "descKR":" ".join([descKR4[0], descKR3[1], descKR2[1], descKR1[1]])},
        "ISFJ":{"code":"ISFJ", "nickname":"salt_lake", "nicknameKR":"염수호", "desc":" ".join([desc4[1], desc3[0], desc2[1], desc1[0]]), "descKR":" ".join([descKR4[1], descKR3[0], descKR2[1], descKR1[0]])},
        "INFJ":{"code":"INFJ", "nickname":"moonlight", "nicknameKR":"달빛", "desc":" ".join([desc4[1], desc3[1], desc2[1], desc1[0]]), "descKR":" ".join([descKR4[1], descKR3[1], descKR2[1], descKR1[0]])},
        "ESFP":{"code":"ESFP", "nickname":"spring_breeze", "nicknameKR":"봄바람", "desc":" ".join([desc4[0], desc3[0], desc2[1], desc1[1]]), "descKR":" ".join([descKR4[0], descKR3[0], descKR2[1], descKR1[1]])},
        "ISFP":{"code":"ISFP", "nickname":"cherry_blossom", "nicknameKR":"벚꽃", "desc":" ".join([desc4[1], desc3[0], desc2[1], desc1[1]]), "descKR":" ".join([descKR4[1], descKR3[0], descKR2[1], descKR1[1]])},
        "ENTJ":{"code":"ENTJ", "nickname":"dawn_breathe", "nicknameKR":"새벽 숨", "desc":" ".join([desc4[0], desc3[1], desc2[0], desc1[0]]), "descKR":" ".join([descKR4[0], descKR3[1], descKR2[0], descKR1[0]])},
        "INTP":{"code":"INTP", "nickname":"blue_hour", "nicknameKR":"여명 빛", "desc":" ".join([desc4[1], desc3[1], desc2[0], desc1[1]]), "descKR":" ".join([descKR4[1], descKR3[1], descKR2[0], descKR1[1]])},
        "ESTJ":{"code":"ESTJ", "nickname":"dune_line", "nicknameKR":"사구선", "desc":" ".join([desc4[0], desc3[0], desc2[0], desc1[0]]), "descKR":" ".join([descKR4[0], descKR3[0], descKR2[0], descKR1[0]])},
        "ESTP":{"code":"ESTP", "nickname":"lightning_flash", "nicknameKR":"번개 섬광", "desc":" ".join([desc4[0], desc3[0], desc2[0], desc1[1]]), "descKR":" ".join([descKR4[0], descKR3[0], descKR2[0], descKR1[1]])},
        "ENTP":{"code":"ENTP", "nickname":"blinking_star", "nicknameKR":"깜박이별", "desc":" ".join([desc4[0], desc3[1], desc2[0], desc1[1]]), "descKR":" ".join([descKR4[0], descKR3[1], descKR2[0], descKR1[1]])},
    }
    gbti_combi_dict = {
        "ENFJ":{"pos":["INFP", "ISFP"], "neg":["ESFP","ISTP", "ESTP","ISFJ", "ESFJ", "ISTJ", "ESTJ"]},
        "INTJ":{"pos":["ENFP", "ENTP"], "neg":["ISFJ", "ESFJ", "ISTJ", "ESTJ"]},
        "ESFJ":{"pos":["ISFP", "ISTP"], "neg":["INFP", "ENFP", "INFJ","ENFJ"]},
        "ISTJ":{"pos":["ESFP"], "neg":["INFP", "ENFP", "INFJ","ENFJ"]},
        "ISTP":{"pos":["ESFJ", "ESTJ"], "neg":["INFP", "ENFP", "INFJ", "ENFJ"]},
        "INFP":{"pos":["ENFJ", "ENTJ"], "neg":["ISFP", "ESFP", "ISTP","ESTP","ISFJ", "ESFJ", "ISTJ", "ESTJ"]},
        "ENFP":{"pos":["INFJ", "INTJ"], "neg":["ISFP", "ESFP", "ISTP","ESTP","ISFJ", "ESFJ", "ISTJ", "ESTJ"]},
        "ISFJ":{"pos":["ESFP", "ESTP"], "neg":["INFP", "ENFP", "INFJ","ENFJ"]},
        "INFJ":{"pos":["ENFP", "ENTP"], "neg":["ISFP", "ESFP", "ISTP","ESTP","ISFJ", "ESFJ", "ISTJ", "ESTJ"]},
        "ESFP":{"pos":["ISFJ", "ISTJ"], "neg":["INFP", "ENFP", "INFJ","ENFJ"]},
        "ISFP":{"pos":["ENFJ", "ESFJ", "ESTJ"], "neg":["INFP", "ENFP","INFJ"]},
        "ENTJ":{"pos":["INFP", "INTP"], "neg":[]},
        "INTP":{"pos":["ENTJ", "ESTJ"], "neg":["ISFJ", "ESFJ", "ISTJ"]},
        "ESTJ":{"pos":["INTP", "ISFP", "ISTP"], "neg":["INFP", "ENFP", "INFJ", "ENFJ"]},
        "ESTP":{"pos":["ISFJ"], "neg":["INFP", "ENFP", "INFJ", "ENFJ"]},
        "ENTP":{"pos":["INFJ", "INTJ"], "neg":["ISFJ", "ESFJ", "ISTJ", "ESTJ"]},
    }
    gbti_dict[code]["pos"] = [gbti_dict[pos_code] for pos_code in gbti_combi_dict[code]["pos"]]
    gbti_dict[code]["neg"] = [gbti_dict[neg_code] for neg_code in gbti_combi_dict[code]["neg"]]
    return gbti_dict[code]