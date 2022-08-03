import sys, os
import MySQLdb
import json, math, time, datetime
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from osp.dev_settings import DATABASES

# 1. 업데이트 기능을 구현하지 않아 테이블 데이터를 delete 하고 실행해야합니다.
# 2. 파이썬 실행의 인자로 annualoverview, annualtotal, distscore, distfactor, student, repository 중에서 선택하여 테이블에 데이터를 insert 할 수 있습니다.
# 인자로 all을 넣으면 모든 테이블에 insert 할 수 있습니다.

def main(mask):
    start = time.time()  # 시작 시간 저장
    startYear = 2019
    startSid = 2011 #소프트웨어학과 설립연도
    nCase = 4 # 복수전공 포함 여부 & 휴학생 포함 여부
    meta = DATABASES['default']

    conn = MySQLdb.connect(
        user=meta['USER'],
        passwd=meta['PASSWORD'],
        host=meta['HOST'],
        port=meta['PORT'],
        db='github_crawl',
        charset='utf8'
    )

    def create2DArray(rows, columns) :
        arr = []
        for i in range(rows):
            col_arr = [ 0 for j in range(columns)]
            arr.append(col_arr)
        return arr
    
    def create2DArray_a(rows, columns):
        arr = []
        for i in range(rows):
            col_arr = [ [] for j in range(columns)]
            arr.append(col_arr)
        return arr

    def calculateMeanOfArray(arr) :
        idx = 0
        newArr = ['{:0.4f}'.format(val / annualCnt[idx]) for val in arr]
        return newArr

    # MySQLdb
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)
    # 업데이트 연도
    repo_sql = """SELECT grs.github_id, grs.create_date FROM github_repo_stats as grs ORDER BY create_date DESC"""
    cursor.execute(repo_sql)
    repo_result = cursor.fetchall()
    try:
        endYear = repo_result[0]["create_date"].year
        print(repo_result[0]["create_date"].year)
    except:
        endYear = datetime.datetime.today().year
    nYear = endYear - startYear + 1
    repo_total = len(repo_result)
    repo_dist = []
    studentRepo = [{} for i in range(nYear)]
    for row in repo_result:
        repo_created = row['create_date'].strftime("%Y")
        yid = endYear - int(repo_created)
        if yid >= len(repo_dist):
            while len(repo_dist)<=yid:
                repo_dist.append(0)
        repo_dist[yid] += 1
        if yid < nYear:
            gid = row['github_id']
            if gid in studentRepo[yid]:
                studentRepo[yid][gid] += 1
            else:
                studentRepo[yid][gid]= 1

    #MODEL6: insert_repo_sql home_repository
    if mask & 32:
        print("exec sql repository")
        try:
            insert_repo_sql = """insert into home_repository (year, owner, repo_num) VALUES (%s, %s, %s)"""
            for i in range(len(studentRepo)):
                for key in studentRepo[i]:
                    cursor.execute(insert_repo_sql, (endYear-i, key, studentRepo[i][key]))

            conn.commit()
        except Exception as e:
            print("insert_repo_sql: ", e)

    for case in range(nCase):
        print("run ", case)
        suffix = ""
        if case == 1:
            suffix = " where st.plural_major = 0"
        elif case == 2:
            suffix = " where st.absence = 0"
        elif case == 3:
            suffix = " where st.absence = 0 and st.plural_major = 0"
        
        select_dept = """SELECT dept, count(dept) from user_githubscoretable group by dept"""
        cursor.execute(select_dept)
        dept_result = cursor.fetchall()
        deptDict = {}
        for dept in dept_result:
            deptDict[dept["dept"]] = len(deptDict.keys())
        nDept = len(deptDict.keys())
        select_sql = """SELECT gs.github_id, gs.year, gs.excellent_contributor, gs.best_repo, gs.star_count, 
        ugs.commit_cnt, ugs.pr_cnt, ugs.issue_cnt, st.id, st.dept, st.absence, st.plural_major, 
        least(round(gs.repo_score_sum+gs.score_other_repo_sum+score_star+score_fork,3), 5) as total_score_sum
        FROM github_score as gs JOIN student_tab as st ON gs.github_id = st.github_id 
        JOIN user_githubscoretable as ugs ON ugs.github_id = st.github_id and ugs.year = gs.year"""
        order_sql = " ORDER BY id ASC"
        cursor.execute(select_sql+suffix+order_sql)
        result = cursor.fetchall()
        for row in result:
            if int(str(row["id"])[:4]) >= startSid:
                nSid = endYear - int(str(row["id"])[:4]) + 1
                print("startSid", int(str(row["id"])[:4]), nSid)
                break
        studentData = [ [] for i in range(nYear)]
        studentRepo = [ {} for i in range(nYear)]
        
        # Year Data: Mean, Var, Std
        scoreAnnual = [ 0 for i in range(nYear)]
        scoreSubAnnual = [ 0 for i in range(nYear)]
        scoreSumAnnual = [ 0 for i in range(nYear)]
        commitAnnual = [ 0 for i in range(nYear)]
        starAnnual = [ 0 for i in range(nYear)]
        prAnnual = [ 0 for i in range(nYear)]
        issueAnnual = [ 0 for i in range(nYear)]
        forkAnnual = [ 0 for i in range(nYear)]

        # Overview Data 
        scoreMore3 = [ 0 for i in range(nYear)]
        scoreSubMore3 = [ 0 for i in range(nYear)]
        scoreSumMore3 = [ 0 for i in range(nYear)]
        totalCommit = [ 0 for i in range(nYear)]
        totalStar = [ 0 for i in range(nYear)]

        # Chart Data: Score, Commits, Stars, PRs, Issues 
        annualCnt = [ 0 for i in range(nYear)]
        deptSize = create2DArray(nYear, nDept)
        sidSize = create2DArray(nYear, nSid)
        
        scoreClassCnt, commitClassCnt, starClassCnt, prClassCnt, issueClassCnt = 10, 5, 5, 5, 5
        scoreClassGap, commitClassGap, starClassGap, prClassGap, issueClassGap = 0.5, 100, 2, 5, 2
        
        # 임시로 구간을 fork에 저장
        forkYearStd = [scoreClassCnt, commitClassCnt, starClassCnt, prClassCnt, issueClassCnt]
        forkMean = [scoreClassGap, commitClassGap, starClassGap, prClassGap, issueClassGap]
        
        # About Score
        scoreDist = create2DArray(nYear, scoreClassCnt)
        scoreDept = create2DArray(nYear, nDept)
        scoreSid = create2DArray(nYear, nSid)
        # About Score sub
        scoreSubDist = create2DArray(nYear, scoreClassCnt)
        scoreSubDept = create2DArray(nYear, nDept)
        scoreSubSid = create2DArray(nYear, nSid)
        # About Score sub
        scoreSumDist = create2DArray(nYear, scoreClassCnt)
        scoreSumDept = create2DArray(nYear, nDept)
        scoreSumSid = create2DArray(nYear, nSid)
        # About Commit
        commitDist = create2DArray(nYear, commitClassCnt)
        commitDept = create2DArray(nYear, nDept)
        commitSid = create2DArray(nYear, nSid)
        # About Star
        starDist = create2DArray(nYear, starClassCnt)
        starDept = create2DArray(nYear, nDept)
        starSid = create2DArray(nYear, nSid)
        # About PRs
        prDist = create2DArray(nYear, prClassCnt)
        prDept = create2DArray(nYear, nDept)
        prSid = create2DArray(nYear, nSid)
        # About Issues
        issueDist = create2DArray(nYear, issueClassCnt)
        issueDept = create2DArray(nYear, nDept)
        issueSid = create2DArray(nYear, nSid)
        # About Forks
        forkDept = create2DArray(nYear, nDept)
        forkSid = create2DArray(nYear, nSid)

        yid, sid, deptid = None, None, None
        for row in result:
            if int(str(row['id'])[:4]) < startSid:
                continue
            yid = row['year'] - startYear
            sid = endYear - int(str(row['id'])[:4])
            deptid = deptDict[row['dept']]
            totalCommit[yid] += row['commit_cnt']
            totalStar[yid] += row['star_count']
            row['total_score_sum'] = row["total_score_sum"]
            
            studentData[yid].append({
                "year": str(row['year']),
                "github_id": str(row["github_id"]),
                "absence": str(row["absence"]),
                "plural_major": str(row["plural_major"]),
                "score": str(row['total_score_sum']),
                "score_diff": str(row['total_score_sum']),
                "score_sum": str(row['total_score_sum']),
                "commit": str(row["commit_cnt"]),
                "star": str(row["star_count"]),
                "pr": str(row["pr_cnt"]),
                "issue": str(row["issue_cnt"]),
                "fork": '0',
            })
            
            total_score = float(row['total_score_sum'])
            total_score_sub = float(row['total_score_sum'])
            total_score_sum = float(row['total_score_sum'])
            # student id 
            scoreSid[yid][sid] += total_score
            scoreSubSid[yid][sid] += total_score_sub
            scoreSumSid[yid][sid] += total_score_sum
            commitSid[yid][sid] += row['commit_cnt']
            starSid[yid][sid] += row['star_count']
            prSid[yid][sid] += row['pr_cnt']
            issueSid[yid][sid] += row['issue_cnt']
            sidSize[yid][sid] += 1
            # dept 
            scoreDept[yid][deptid] += total_score
            scoreSubDept[yid][deptid] += total_score_sub
            scoreSumDept[yid][deptid] += total_score_sum
            commitDept[yid][deptid] += row['commit_cnt']
            starDept[yid][deptid] += row['star_count']
            prDept[yid][deptid] += row['pr_cnt']
            issueDept[yid][deptid] += row['issue_cnt']
            deptSize[yid][deptid] += 1
            
            classIdx = math.floor(total_score*2) if math.floor(total_score*2) <= (scoreClassCnt-1) else scoreClassCnt-1
            scoreDist[yid][classIdx] += 1
            scoreMore3[yid] += 1 if total_score >= 3 else 0
            
            classIdx = math.floor(total_score_sub*2) if math.floor(total_score_sub*2) <= (scoreClassCnt-1) else scoreClassCnt-1
            scoreSubDist[yid][classIdx] += 1
            scoreSubMore3[yid] += 1 if total_score_sub >= 3 else 0
            
            classIdx = math.floor(total_score_sum*2) if math.floor(total_score_sum*2) <= scoreClassCnt-1 else scoreClassCnt-1
            scoreSumDist[yid][classIdx] += 1
            scoreSumMore3[yid] += 1 if total_score_sum >= 3 else 0

            classIdx = math.floor(row['commit_cnt']/commitClassGap) if math.floor(row['commit_cnt']/commitClassGap) <= commitClassCnt-1 else commitClassCnt-1
            commitDist[yid][classIdx] += 1
            
            classIdx = math.floor(row['star_count']/starClassGap) if math.floor(row['star_count']/starClassGap) <= starClassCnt-1 else starClassCnt-1
            starDist[yid][classIdx] += 1
            
            classIdx = math.floor(row['pr_cnt']/prClassGap) if math.floor(row['pr_cnt']/prClassGap) <= prClassCnt-1 else prClassCnt-1
            prDist[yid][classIdx] += 1
            
            classIdx = math.floor(row['issue_cnt']/issueClassGap) if math.floor(row['issue_cnt']/issueClassGap) <= issueClassCnt-1 else issueClassCnt-1
            issueDist[yid][classIdx] += 1

            # annual Total sum
            scoreAnnual[yid] += total_score
            scoreSubAnnual[yid] += total_score_sub
            scoreSumAnnual[yid] += total_score_sum
            commitAnnual[yid] += row['commit_cnt']
            starAnnual[yid] += row['star_count']
            prAnnual[yid] += row['pr_cnt']
            issueAnnual[yid] += row['issue_cnt']
            annualCnt[yid] += 1

        # 상위 5%의 데이터 셋 만들기 
        scoreSidTop5pct = create2DArray_a(nYear, nSid)
        scoreDeptTop5pct = create2DArray_a(nYear, nDept)
        scoreSubSidTop5pct = create2DArray_a(nYear, nSid)
        scoreSubDeptTop5pct = create2DArray_a(nYear, nDept)
        scoreSumSidTop5pct = create2DArray_a(nYear, nSid)
        scoreSumDeptTop5pct = create2DArray_a(nYear, nDept)
        commitSidTop5pct = create2DArray_a(nYear, nSid)
        commitDeptTop5pct = create2DArray_a(nYear, nDept)
        starSidTop5pct = create2DArray_a(nYear, nSid)
        starDeptTop5pct = create2DArray_a(nYear, nDept)
        prSidTop5pct = create2DArray_a(nYear, nSid)
        prDeptTop5pct = create2DArray_a(nYear, nDept)
        issueSidTop5pct = create2DArray_a(nYear, nSid)
        issueDeptTop5pct = create2DArray_a(nYear, nDept)
        for row in result:
            if int(str(row['id'])[:4]) < startSid:
                continue
            yid = row['year'] - startYear
            sid = endYear - int(str(row['id'])[:4])
            deptid = deptDict[row['dept']]
            nSidTopTier = int((sidSize[yid][sid] * 5) / 100) + 1
            nDeptTopTier = int((deptSize[yid][deptid] * 5) / 100) + 1
            # score -- student id
            total_score = float(row['total_score_sum'])
            if total_score > 0 :
                list_len = len(scoreSidTop5pct[yid][sid])
                if nSidTopTier > list_len:
                    scoreSidTop5pct[yid][sid].append(total_score)
                    scoreSidTop5pct[yid][sid].sort()
                elif min(scoreSidTop5pct[yid][sid]) < total_score:
                    scoreSidTop5pct[yid][sid].append(total_score)
                    scoreSidTop5pct[yid][sid].sort()
                    del scoreSidTop5pct[yid][sid][0]
                # score -- department
                list_len = len(scoreDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len:
                    scoreDeptTop5pct[yid][deptid].append(total_score)
                    scoreDeptTop5pct[yid][deptid].sort()
                elif min(scoreDeptTop5pct[yid][deptid]) < total_score:
                    scoreDeptTop5pct[yid][deptid].append(total_score)
                    scoreDeptTop5pct[yid][deptid].sort()
                    del scoreDeptTop5pct[yid][deptid][0]
            total_score_sub = float(row['total_score_sum'])
            if total_score_sub > 0:
                # score sub -- student id
                list_len = len(scoreSubSidTop5pct[yid][sid])
                if nSidTopTier > list_len :
                    scoreSubSidTop5pct[yid][sid].append(total_score_sub)
                    scoreSubSidTop5pct[yid][sid].sort()
                elif min(scoreSubSidTop5pct[yid][sid]) < total_score_sub:
                    scoreSubSidTop5pct[yid][sid].append(total_score_sub)
                    scoreSubSidTop5pct[yid][sid].sort()
                    del scoreSubSidTop5pct[yid][sid][0]
                # score sub -- department
                list_len = len(scoreSubDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len :
                    scoreSubDeptTop5pct[yid][deptid].append(total_score_sub)
                    scoreSubDeptTop5pct[yid][deptid].sort()
                elif min(scoreSubDeptTop5pct[yid][deptid]) < total_score_sub:
                    scoreSubDeptTop5pct[yid][deptid].append(total_score_sub)
                    scoreSubDeptTop5pct[yid][deptid].sort()
                    del scoreSubDeptTop5pct[yid][deptid][0]
            total_score_sum = float(row['total_score_sum'])
            if total_score_sum > 0 :
                 # score sum -- student id
                list_len = len(scoreSumSidTop5pct[yid][sid])
                if nSidTopTier > list_len:
                    scoreSumSidTop5pct[yid][sid].append(total_score_sum)
                    scoreSumSidTop5pct[yid][sid].sort()
                elif min(scoreSumSidTop5pct[yid][sid]) < total_score_sum:
                    scoreSumSidTop5pct[yid][sid].append(total_score_sum)
                    scoreSumSidTop5pct[yid][sid].sort()
                    del scoreSumSidTop5pct[yid][sid][0]
                # score sum -- department
                list_len = len(scoreSumDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len :
                    scoreSumDeptTop5pct[yid][deptid].append(total_score_sum)
                    scoreSumDeptTop5pct[yid][deptid].sort()
                elif min(scoreSumDeptTop5pct[yid][deptid]) < total_score_sum:
                    scoreSumDeptTop5pct[yid][deptid].append(total_score_sum)
                    scoreSumDeptTop5pct[yid][deptid].sort()
                    del scoreSumDeptTop5pct[yid][deptid][0]
            if row['commit_cnt'] > 0 :
                # commit -- student id
                list_len = len(commitSidTop5pct[yid][sid])
                if nSidTopTier > list_len :
                    commitSidTop5pct[yid][sid].append(row['commit_cnt'])
                    commitSidTop5pct[yid][sid].sort()
                elif min(commitSidTop5pct[yid][sid]) < row['commit_cnt']:
                    commitSidTop5pct[yid][sid].append(row['commit_cnt'])
                    commitSidTop5pct[yid][sid].sort()
                    del commitSidTop5pct[yid][sid][0]
                #commit -- department
                list_len = len(commitDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len :
                    commitDeptTop5pct[yid][deptid].append(row['commit_cnt'])
                    commitDeptTop5pct[yid][deptid].sort()
                elif min(commitDeptTop5pct[yid][deptid]) < row['commit_cnt']:
                    commitDeptTop5pct[yid][deptid].append(row['commit_cnt'])
                    commitDeptTop5pct[yid][deptid].sort()
                    del commitDeptTop5pct[yid][deptid][0]
            if row['star_count'] > 0 :
                # star -- student id
                list_len = len(starSidTop5pct[yid][sid])
                if nSidTopTier > list_len :
                    starSidTop5pct[yid][sid].append(row['star_count'])
                    starSidTop5pct[yid][sid].sort()
                elif min(starSidTop5pct[yid][sid]) < row['star_count']:
                    starSidTop5pct[yid][sid].append(row['star_count'])
                    starSidTop5pct[yid][sid].sort()
                    del starSidTop5pct[yid][sid][0]
                # star -- department
                list_len = len(starDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len :
                    starDeptTop5pct[yid][deptid].append(row['star_count'])
                    starDeptTop5pct[yid][deptid].sort()
                elif min(starDeptTop5pct[yid][deptid]) < row['star_count']:
                    starDeptTop5pct[yid][deptid].append(row['star_count'])
                    starDeptTop5pct[yid][deptid].sort()
                    del starDeptTop5pct[yid][deptid][0]
            if row['pr_cnt'] > 0 :
                # prs -- student id
                list_len = len(prSidTop5pct[yid][sid])
                if nSidTopTier > list_len :
                    prSidTop5pct[yid][sid].append(row['pr_cnt'])
                    prSidTop5pct[yid][sid].sort()
                elif min(prSidTop5pct[yid][sid]) < row['pr_cnt']:
                    prSidTop5pct[yid][sid].append(row['pr_cnt'])
                    prSidTop5pct[yid][sid].sort()
                    del prSidTop5pct[yid][sid][0]
                # prs -- department
                list_len = len(prDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len :
                    prDeptTop5pct[yid][deptid].append(row['pr_cnt'])
                    prDeptTop5pct[yid][deptid].sort()
                elif min(prDeptTop5pct[yid][deptid]) < row['pr_cnt']:
                    prDeptTop5pct[yid][deptid].append(row['pr_cnt'])
                    prDeptTop5pct[yid][deptid].sort()
                    del prDeptTop5pct[yid][deptid][0]
            if row['issue_cnt'] > 0 :
                # issue -- student id
                list_len = len(issueSidTop5pct[yid][sid])
                if nSidTopTier > list_len :
                    issueSidTop5pct[yid][sid].append(row['issue_cnt'])
                    issueSidTop5pct[yid][sid].sort()
                elif min(issueSidTop5pct[yid][sid]) < row['issue_cnt']:
                    issueSidTop5pct[yid][sid].append(row['issue_cnt'])
                    issueSidTop5pct[yid][sid].sort()
                    del issueSidTop5pct[yid][sid][0]
                # issue -- department
                list_len = len(issueDeptTop5pct[yid][deptid])
                if nDeptTopTier > list_len :
                    issueDeptTop5pct[yid][deptid].append(row['issue_cnt'])
                    issueDeptTop5pct[yid][deptid].sort()

                elif min(issueDeptTop5pct[yid][deptid]) < row['issue_cnt']:
                    issueDeptTop5pct[yid][deptid].append(row['issue_cnt'])
                    issueDeptTop5pct[yid][deptid].sort()
                    del issueDeptTop5pct[yid][deptid][0]
        # 학번 평균, 학과 평균 구하기 
        # object 타입으로 map함수 사용불가
        for i in range(nYear):
            for j in range(len(scoreSid[i])):
                if sidSize[i][j] == 0:
                    continue
                scoreSid[i][j] = '{:0.4f}'.format(scoreSid[i][j] / sidSize[i][j])
                scoreSubSid[i][j] = '{:0.4f}'.format(scoreSubSid[i][j] / sidSize[i][j])
                scoreSumSid[i][j] = '{:0.4f}'.format(scoreSumSid[i][j] / sidSize[i][j])
                commitSid[i][j] = '{:0.4f}'.format(commitSid[i][j] / sidSize[i][j])
                starSid[i][j] = '{:0.4f}'.format(starSid[i][j] / sidSize[i][j])
                prSid[i][j] = '{:0.4f}'.format(prSid[i][j] / sidSize[i][j])
                issueSid[i][j] = '{:0.4f}'.format(issueSid[i][j] / sidSize[i][j])
                forkSid[i][j] = '{:0.4f}'.format(forkSid[i][j] / sidSize[i][j])
        for i in range(nYear):
            for j in range(len(scoreDept[i])):
                if deptSize[i][j] == 0:
                    continue
                scoreDept[i][j] = '{:0.4f}'.format(scoreDept[i][j] / deptSize[i][j])
                scoreSubDept[i][j] = '{:0.4f}'.format(scoreSubDept[i][j] / deptSize[i][j])
                scoreSumDept[i][j] = '{:0.4f}'.format(scoreSumDept[i][j] / deptSize[i][j])
                commitDept[i][j] = '{:0.4f}'.format(commitDept[i][j] / deptSize[i][j])
                starDept[i][j] = '{:0.4f}'.format(starDept[i][j] / deptSize[i][j])
                prDept[i][j] = '{:0.4f}'.format(prDept[i][j] / deptSize[i][j])
                issueDept[i][j] = '{:0.4f}'.format(issueDept[i][j] / deptSize[i][j])
                forkDept[i][j] = '{:0.4f}'.format(forkDept[i][j] / deptSize[i][j])

        # 연도별 점수, 커밋, 스타, pr, issue 평균 계산
        scoreMean = calculateMeanOfArray(scoreAnnual)
        scoreSubMean = calculateMeanOfArray(scoreSubAnnual)
        scoreSumMean = calculateMeanOfArray(scoreSumAnnual)
        commitMean = calculateMeanOfArray(commitAnnual)
        starMean = calculateMeanOfArray(starAnnual)
        prMean = calculateMeanOfArray(prAnnual)
        issueMean = calculateMeanOfArray(issueAnnual)
        

        # 학번별, 학과별, 연도별에 대해 점수, 커밋, 스타, 풀리, 이슈 등 각각의 분산과 표준편차 계산 
        scoreSidDevTotal = create2DArray(nYear, nSid)
        scoreSubSidDevTotal = create2DArray(nYear, nSid)
        scoreSumSidDevTotal = create2DArray(nYear, nSid)
        commitSidDevTotal = create2DArray(nYear, nSid)
        starSidDevTotal = create2DArray(nYear, nSid)
        prSidDevTotal = create2DArray(nYear, nSid)
        issueSidDevTotal = create2DArray(nYear, nSid)
        forkSidDevTotal = create2DArray(nYear, nSid)
        scoreDeptDevTotal = create2DArray(nYear, nDept)
        scoreSubDeptDevTotal = create2DArray(nYear, nDept)
        scoreSumDeptDevTotal = create2DArray(nYear, nDept)
        commitDeptDevTotal = create2DArray(nYear, nDept)
        starDeptDevTotal = create2DArray(nYear, nDept)
        prDeptDevTotal = create2DArray(nYear, nDept)
        issueDeptDevTotal = create2DArray(nYear, nDept)
        forkDeptDevTotal = create2DArray(nYear, nDept)
        scoreYearDevTotal = [ 0 for i in range(nYear)]
        scoreSubYearDevTotal = [ 0 for i in range(nYear)]
        scoreSumYearDevTotal = [ 0 for i in range(nYear)]
        commitYearDevTotal = [ 0 for i in range(nYear)]
        starYearDevTotal = [ 0 for i in range(nYear)]
        prYearDevTotal = [ 0 for i in range(nYear)]
        issueYearDevTotal = [ 0 for i in range(nYear)]
        forkYearDevTotal = [ 0 for i in range(nYear)]
        for row in result:
            if int(str(row['id'])[:4]) < startSid:
                continue
            yid = row['year'] - startYear
            # student id 
            sid = endYear - int(str(row['id'])[:4])
            scoreSidDevTotal[yid][sid] += math.pow(row['total_score_sum'] - float(scoreSid[yid][sid]),2)
            scoreSubSidDevTotal[yid][sid] += math.pow(row['total_score_sum'] - float(scoreSubSid[yid][sid]),2)
            scoreSumSidDevTotal[yid][sid] += math.pow(row['total_score_sum'] - float(scoreSumSid[yid][sid]),2)
            commitSidDevTotal[yid][sid] += math.pow(row['commit_cnt'] - float(commitSid[yid][sid]),2)
            starSidDevTotal[yid][sid] += math.pow(row['star_count'] - float(starSid[yid][sid]),2)
            prSidDevTotal[yid][sid] += math.pow(row['pr_cnt'] - float(prSid[yid][sid]),2)
            issueSidDevTotal[yid][sid] += math.pow(row['issue_cnt'] - float(issueSid[yid][sid]),2)

            # dept 
            deptid = deptDict[row['dept']]
            scoreDeptDevTotal[yid][deptid] += math.pow(row['total_score_sum'] - float(scoreDept[yid][deptid]),2)
            scoreSubDeptDevTotal[yid][deptid] += math.pow(row['total_score_sum'] - float(scoreSubDept[yid][deptid]),2)
            scoreSumDeptDevTotal[yid][deptid] += math.pow(row['total_score_sum'] - float(scoreSumDept[yid][deptid]),2)
            commitDeptDevTotal[yid][deptid] += math.pow(row['commit_cnt'] - float(commitDept[yid][deptid]),2)
            starDeptDevTotal[yid][deptid] += math.pow(row['star_count'] - float(starDept[yid][deptid]),2)
            prDeptDevTotal[yid][deptid] += math.pow(row['pr_cnt'] - float(prDept[yid][deptid]),2)
            issueDeptDevTotal[yid][deptid] += math.pow(row['issue_cnt'] - float(issueDept[yid][deptid]),2)
            
            # year 
            scoreYearDevTotal[yid] += math.pow(row['total_score_sum'] - float(scoreMean[yid]),2)
            scoreSubYearDevTotal[yid] += math.pow(row['total_score_sum'] - float(scoreSubMean[yid]),2)
            scoreSumYearDevTotal[yid] += math.pow(row['total_score_sum'] - float(scoreSumMean[yid]),2)
            commitYearDevTotal[yid] += math.pow(row['commit_cnt'] - float(commitMean[yid]), 2)
            starYearDevTotal[yid] += math.pow(row['star_count'] - float(starMean[yid]),2)
            prYearDevTotal[yid] += math.pow(row['pr_cnt'] - float(prMean[yid]),2)
            issueYearDevTotal[yid] += math.pow(row['issue_cnt'] - float(issueMean[yid]),2)

        scoreSidStd = create2DArray(nYear, nSid)
        scoreSubSidStd = create2DArray(nYear, nSid)
        scoreSumSidStd = create2DArray(nYear, nSid)
        commitSidStd = create2DArray(nYear, nSid)
        starSidStd = create2DArray(nYear, nSid)
        prSidStd = create2DArray(nYear, nSid)
        issueSidStd = create2DArray(nYear, nSid)
        forkSidStd = create2DArray(nYear, nSid)
        scoreDeptStd = create2DArray(nYear, nDept)
        scoreSubDeptStd = create2DArray(nYear, nDept)
        scoreSumDeptStd = create2DArray(nYear, nDept)
        commitDeptStd = create2DArray(nYear, nDept)
        starDeptStd = create2DArray(nYear, nDept)
        prDeptStd = create2DArray(nYear, nDept)
        issueDeptStd = create2DArray(nYear, nDept)
        forkDeptStd = create2DArray(nYear, nDept)
        scoreYearStd = [ 0 for i in range(nYear)]
        scoreSubYearStd = [ 0 for i in range(nYear)]
        scoreSumYearStd = [ 0 for i in range(nYear)]
        commitYearStd = [ 0 for i in range(nYear)]
        starYearStd = [ 0 for i in range(nYear)]
        prYearStd = [ 0 for i in range(nYear)]
        issueYearStd = [ 0 for i in range(nYear)]
        
        for (i, j) in [ (i, j) for i in range(nYear) for j in range(nSid) ]:
            if sidSize[i][j] == 0:
                scoreSidStd[i][j] = "NaN"
                scoreSubSidStd[i][j] = "NaN"
                scoreSumSidStd[i][j] = "NaN"
                commitSidStd[i][j] = "NaN"
                starSidStd[i][j] = "NaN"
                prSidStd[i][j] = "NaN"
                issueSidStd[i][j] = "NaN"
                forkSidStd[i][j] = "NaN"
                scoreSidStd[i][j] = "NaN"
            else:
                scoreSidStd[i][j] = '{:0.4f}'.format(math.sqrt(scoreSidDevTotal[i][j] / sidSize[i][j]))
                scoreSubSidStd[i][j] = '{:0.4f}'.format(math.sqrt(scoreSubSidDevTotal[i][j] / sidSize[i][j]))
                scoreSumSidStd[i][j] = '{:0.4f}'.format(math.sqrt(scoreSumSidDevTotal[i][j] / sidSize[i][j]))
                commitSidStd[i][j] = '{:0.4f}'.format(math.sqrt(commitSidDevTotal[i][j] / sidSize[i][j]))
                starSidStd[i][j] = '{:0.4f}'.format(math.sqrt(starSidDevTotal[i][j] / sidSize[i][j]))
                prSidStd[i][j] = '{:0.4f}'.format(math.sqrt(prSidDevTotal[i][j] / sidSize[i][j]))
                issueSidStd[i][j] = '{:0.4f}'.format(math.sqrt(issueSidDevTotal[i][j] / sidSize[i][j]))
                forkSidStd[i][j] = '{:0.4f}'.format(math.sqrt(forkSidDevTotal[i][j] / sidSize[i][j]))
        for (i, j) in [ (i, j) for i in range(nYear) for j in range(nDept) ]:
            if deptSize[i][j] == 0:
                scoreDeptStd[i][j] = "NaN"
                scoreSubDeptStd[i][j] = "NaN"
                scoreSumDeptStd[i][j] = "NaN"
                commitDeptStd[i][j] = "NaN"
                starDeptStd[i][j] = "NaN"
                prDeptStd[i][j] = "NaN"
                issueDeptStd[i][j] = "NaN"
                forkDeptStd[i][j] = "NaN"
            else:
                scoreDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(scoreDeptDevTotal[i][j] / deptSize[i][j]))
                scoreSubDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(scoreSubDeptDevTotal[i][j] / deptSize[i][j]))
                scoreSumDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(scoreSumDeptDevTotal[i][j] / deptSize[i][j]))
                commitDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(commitDeptDevTotal[i][j] / deptSize[i][j]))
                starDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(starDeptDevTotal[i][j] / deptSize[i][j]))
                prDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(prDeptDevTotal[i][j] / deptSize[i][j]))
                issueDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(issueDeptDevTotal[i][j] / deptSize[i][j]))
                forkDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(forkDeptDevTotal[i][j] / deptSize[i][j]))
        for i in range(nYear) :
            if annualCnt[i] == 0:
                scoreYearStd[i] = "NaN"
                scoreSubYearStd[i] = "NaN"
                scoreSumYearStd[i] = "NaN"
                commitYearStd[i] = "NaN"
                starYearStd[i] = "NaN"
                prYearStd[i] = "NaN"
                issueYearStd[i] = "NaN"
                forkYearStd[i] = "NaN"
            else:
                scoreYearStd[i] = '{:0.4f}'.format(math.sqrt(scoreYearDevTotal[i] / annualCnt[i]))
                scoreSubYearStd[i] = '{:0.4f}'.format(math.sqrt(scoreSubYearDevTotal[i] / annualCnt[i]))
                scoreSumYearStd[i] = '{:0.4f}'.format(math.sqrt(scoreSumYearDevTotal[i] / annualCnt[i]))
                commitYearStd[i] = '{:0.4f}'.format(math.sqrt(commitYearDevTotal[i] / annualCnt[i]))
                starYearStd[i] = '{:0.4f}'.format(math.sqrt(starYearDevTotal[i] / annualCnt[i]))
                prYearStd[i] = '{:0.4f}'.format(math.sqrt(prYearDevTotal[i] / annualCnt[i]))
                issueYearStd[i] = '{:0.4f}'.format(math.sqrt(issueYearDevTotal[i] / annualCnt[i]))
        
        # MODEL1: insert_annualoverview_sql
        if mask & 1:
            print("exec sql annualoverview")
            try:
                delete_annualoverview_sql = """DELETE FROM home_annualoverview WHERE case_num = %d"""%case
                insert_annualoverview_sql = """INSERT INTO home_annualoverview 
                (case_num, score, score_diff, score_sum, score_std, score_std_diff, score_std_sum, 
                commit, commit_std, star, star_std, pr, pr_std, issue, issue_std, fork, fork_std) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                cursor.execute(delete_annualoverview_sql)
                cursor.execute(insert_annualoverview_sql, 
                    (case, json.dumps(scoreMean), json.dumps(scoreSubMean), json.dumps(scoreSumMean), json.dumps(scoreYearStd), json.dumps(scoreSubYearStd), json.dumps(scoreSumYearStd), 
                    json.dumps(commitMean), json.dumps(commitYearStd), json.dumps(starMean), json.dumps(starYearStd), json.dumps(prMean), json.dumps(prYearStd), json.dumps(issueMean), json.dumps(issueYearStd), json.dumps(forkMean), json.dumps(forkYearStd)))
                conn.commit()
            except Exception as e:
                print("insert_annualoverview_sql ", e)
                
        # MODEL2: insert_annualtotal_sql
        if mask & 2:
            print("exec sql annualtotal")
            try:
                delete_annualtotal_sql = """DELETE FROM home_annualtotal WHERE case_num = %d"""%case
                insert_annualtotal_sql = """INSERT INTO home_annualtotal 
                (case_num, student_KP, student_KP_diff, student_KP_sum, student_total, commit, star, repo, repo_total) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                cursor.execute(delete_annualtotal_sql)
                cursor.execute(insert_annualtotal_sql, 
                    (case, json.dumps(scoreMore3), json.dumps(scoreSubMore3), json.dumps(scoreSumMore3), json.dumps(annualCnt),json.dumps(totalCommit), json.dumps(totalStar), json.dumps(repo_dist), repo_total))
                conn.commit()
            except Exception as e:
                print("insert_annualtotal_sql ", e)
            
        # MODEL3: insert_distscore_sql
        if mask & 4:
            print("exec sql distscore")
            try:
                delete_distscore_sql = """DELETE FROM home_distscore WHERE case_num = %d"""%case
                insert_distscore_sql = """INSERT INTO home_distscore 
                (case_num, year, score, score_diff, score_sum, 
                score_sid, score_sid_diff, score_sid_sum, score_sid_std, score_sid_std_diff, score_sid_std_sum, score_sid_pct, score_sid_pct_diff, score_sid_pct_sum, 
                score_dept, score_dept_diff, score_dept_sum, score_dept_std, score_dept_std_diff, score_dept_std_sum, score_dept_pct, score_dept_pct_diff, score_dept_pct_sum) 
                VALUES (%s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                cursor.execute(delete_distscore_sql)
                for yid in range(nYear) :
                    cursor.execute(insert_distscore_sql, 
                    (case, yid+startYear, json.dumps(scoreDist[yid]), json.dumps(scoreSubDist[yid]), json.dumps(scoreSumDist[yid]), 
                    json.dumps(scoreSid[yid]), json.dumps(scoreSubSid[yid]), json.dumps(scoreSumSid[yid]), json.dumps(scoreSidStd[yid]), json.dumps(scoreSubSidStd[yid]), json.dumps(scoreSumSidStd[yid]), json.dumps(scoreSidTop5pct[yid]), json.dumps(scoreSubSidTop5pct[yid]), json.dumps(scoreSumSidTop5pct[yid]),
                    json.dumps(scoreDept[yid]), json.dumps(scoreSubDept[yid]), json.dumps(scoreSumDept[yid]), json.dumps(scoreDeptStd[yid]), json.dumps(scoreSubDeptStd[yid]), json.dumps(scoreSumDeptStd[yid]), json.dumps(scoreDeptTop5pct[yid]), json.dumps(scoreSubDeptTop5pct[yid]), json.dumps(scoreSumDeptTop5pct[yid])))
                conn.commit()
            except Exception as e:
                print("insert_distscore_sql ", e)
            
        # MODEL4: insert_distfactor_sql
        if mask & 8:
            print("exec sql distfactor")
            try:
                delete_distfactor_sql = """DELETE FROM home_distfactor WHERE case_num = %d"""%case
                insert_distfactor_sql = """INSERT INTO home_distfactor 
                (case_num, year, factor, value,
                value_sid, value_sid_std, value_sid_pct,
                value_dept, value_dept_std, value_dept_pct) 
                VALUES (%s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s)"""
                cursor.execute(delete_distfactor_sql)
                for yid in range(nYear) :
                    cursor.execute(insert_distfactor_sql, 
                    (case, yid+startYear, "commit", json.dumps(commitDist[yid]), 
                    json.dumps(commitSid[yid]), json.dumps(commitSidStd[yid]), json.dumps(commitSidTop5pct[yid]), 
                    json.dumps(commitDept[yid]), json.dumps(commitDeptStd[yid]), json.dumps(commitDeptTop5pct[yid])))
                    cursor.execute(insert_distfactor_sql, 
                    (case, yid+startYear, "star", json.dumps(starDist[yid]), 
                    json.dumps(starSid[yid]), json.dumps(starSidStd[yid]), json.dumps(starSidTop5pct[yid]), 
                    json.dumps(starDept[yid]), json.dumps(starDeptStd[yid]), json.dumps(starDeptTop5pct[yid])))
                    cursor.execute(insert_distfactor_sql, 
                    (case, yid+startYear, "pr", json.dumps(prDist[yid]), 
                    json.dumps(prSid[yid]), json.dumps(prSidStd[yid]), json.dumps(prSidTop5pct[yid]), 
                    json.dumps(prDept[yid]), json.dumps(prDeptStd[yid]), json.dumps(prDeptTop5pct[yid])))
                    cursor.execute(insert_distfactor_sql, 
                    (case, yid+startYear, "issue", json.dumps(issueDist[yid]), 
                    json.dumps(issueSid[yid]), json.dumps(issueSidStd[yid]), json.dumps(issueSidTop5pct[yid]), 
                    json.dumps(issueDept[yid]), json.dumps(issueDeptStd[yid]), json.dumps(issueDeptTop5pct[yid])))
                conn.commit()
            except Exception as e:
                print("insert_distfactor_sql ", e)

        # MODEL5: insert_student_sql
        if (mask & 16) and suffix == "":
            print("exec sql student")
            try:
                delete_student_sql = """DELETE FROM home_student"""
                insert_student_sql = """INSERT INTO home_student 
                (year, github_id, absence, plural_major, score, score_diff, score_sum, commit, star, pr, issue, fork) 
                VALUES (%(year)s, %(github_id)s, %(absence)s, %(plural_major)s, %(score)s, %(score_diff)s, %(score_sum)s, %(commit)s, %(star)s, %(pr)s, %(issue)s, %(fork)s)"""
                cursor.execute(delete_student_sql)
                for yid in range(nYear):
                    cursor.executemany(insert_student_sql, studentData[yid])
                conn.commit()
            except Exception as e:
                print("insert_student_sql ", e)
            
    conn.close()
    print("time :", round((time.time() - start), 4))  # 현재시각 - 시작시간 = 실행 시간

if __name__ == '__main__':
    mask = 0
    if len(sys.argv) > 1 :
        for arg in sys.argv:
            if arg == "all":
                mask = 63
                break;
            elif arg == "repository":
                mask += 32
            elif arg == "annualoverview":
                mask += 1
            elif arg == "annualtotal":
                mask += 2
            elif arg == "distscore":
                mask += 4
            elif arg == "distfactor":
                mask += 8
            elif arg == "student":
                mask += 16
    main(mask)
