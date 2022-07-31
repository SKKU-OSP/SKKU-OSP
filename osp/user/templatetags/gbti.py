def getGBTI(type1, type2, type3, type4):
    code, desc, descKR = "","",""
    code += "E" if type1 > 0 else "I"
    code += "S" if type2 > 0 else "N"
    code += "T" if type3 > 0 else "F"
    code += "J" if type4 > 0 else "P"
    
    (desc, descKR) = (desc+"Steady",descKR+"꾸준하며") if type4 > 0 else (desc+"Fluid",descKR+"유연하며")
    (desc, descKR) = (desc+" Cool-head",descKR+" 냉철한 이성의") if type3 > 0 else (desc+" Warm-heart",descKR+" 따뜻한 마음씨의")
    (desc, descKR) = (desc+" Efficient",descKR+" 효율적인") if type2 > 0 else (desc+" Creative",descKR+" 창의적인")
    (desc, descKR) = (desc+" Multiplayer",descKR+" 협동가") if type1 > 0 else (desc+" Singleplayer",descKR+" 자립가")
    print(code, desc, descKR)
    gbti_dict = {
        "ENFJ":{"nickname":"twilight", "nicknameKR":"해 질 녘"},
        "INTJ":{"nickname":"deep_ocean", "nicknameKR":"심해"},
        "ESFJ":{"nickname":"morning_dew", "nicknameKR":"아침 이슬"},
        "ISTJ":{"nickname":"fog_city", "nicknameKR":"안개 도시"},
        "ISTP":{"nickname":"summer_shower", "nicknameKR":"소나기"},
        "INFP":{"nickname":"snowflake", "nicknameKR":"눈송이"},
        "ENFP":{"nickname":"rainbow_cloud", "nicknameKR":"무지개 구름"},
        "ISFJ":{"nickname":"salt_lake", "nicknameKR":"염수호"},
        "INFJ":{"nickname":"moonlight", "nicknameKR":"달빛"},
        "ESFP":{"nickname":"spring_breeze", "nicknameKR":"봄바람"},
        "ISFP":{"nickname":"cherry_blossom", "nicknameKR":"벚꽃"},
        "ENTJ":{"nickname":"dawn_breathe", "nicknameKR":"새벽 숨"},
        "INTP":{"nickname":"blue_hour", "nicknameKR":"여명 빛"},
        "ESTJ":{"nickname":"dune_line", "nicknameKR":"사구선"},
        "ESTP":{"nickname":"lightning_flash", "nicknameKR":"번개 섬광"},
        "ENTP":{"nickname":"blinking_star", "nicknameKR":"깜박이별"},
    }
    gbti_dict[code]["code"] = code
    gbti_dict[code]["desc"] = desc
    gbti_dict[code]["descKR"] = descKR
    return gbti_dict[code]