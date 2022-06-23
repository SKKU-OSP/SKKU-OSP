import sys, os
import MySQLdb
import json
import math
import time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from osp.dev_settings import DATABASES

# 1. 업데이트 기능을 구현하지 않아 테이블 데이터를 delete 하고 실행해야합니다.
# 2. 파이썬 실행의 인자로 annualoverview, annualtotal, distscore, distfactor, student, repository 중에서 선택하여 테이블에 데이터를 insert 할 수 있습니다.
# 인자로 all을 넣으면 모든 테이블에 insert 할 수 있습니다.

def main(mask):
    start = time.time()  # 시작 시간 저장
    startYear = 2019
    nowYear = 2021
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
            col_arr = []
            for j in range(columns):
                col_arr.append(0)
            arr.append(col_arr)
        return arr
    
    def create2DArray_a(rows, columns):
        arr = []
        for i in range(rows):
            col_arr=[]
            for j in range(columns):
                col_arr.append([])
            arr.append(col_arr)
        return arr

    def calculateMeanOfArray(arr) :
        idx = 0
        newArr = list()
        for val in arr :
            newArr.append('{:0.2f}'.format(val / annualCnt[idx]))
        return newArr

    # MySQLdb
    cursor = conn.cursor(MySQLdb.cursors.DictCursor)

    repo_sql = """select grs.github_id, grs.create_date from github_repo_stats as grs"""
    cursor.execute(repo_sql)
    repo_result = cursor.fetchall()
    repo_total = len(repo_result)
    repo_dist = []
    for i in range(7):
        repo_dist.append(0)
    studentRepo = []

    for i in range(3):
        studentRepo.append({})
    for row in repo_result:
        repo_created = row['create_date'].strftime("%Y")
        idx = nowYear - int(repo_created)
        if idx < 7 : 
            repo_dist[idx] += 1
        if idx < 3:
            gid = row['github_id']
            if gid in studentRepo[idx]:
                studentRepo[idx][gid] += 1
            else:
                studentRepo[idx][gid]= 1
    
    #MODEL6: insert_repo_sql home_repository
    if mask & 32: # pow(2,5)
        print("exec sql repository")
        try:
            insert_repo_sql = """insert into home_repository (year, owner, repo_num) VALUES (%s, %s, %s)"""
            for i in range(len(studentRepo)):
                for key in studentRepo[i]:
                    cursor.execute(insert_repo_sql, (nowYear-i, key, studentRepo[i][key]))

            conn.commit()
        except Exception as e:
            print("insert_repo_sql: ", e)

    for case in range(4):
        
        suffix = ""
        if case == 1:
            suffix = " where st.plural_major = 0"
        elif case == 2:
            suffix = " where st.absence = 0"
        elif case == 3:
            suffix = " where st.absence = 0 and st.plural_major = 0"
        
        select_sql = """SELECT gs.github_id, gs.year, gs.excellent_contributor, 
        round(gs.guideline_score+gs.code_score+gs.other_project_score,1) as owner_score, 
        gs.contributor_score, round(gs.star_score+gs.contribution_score,1) as additional_score,  
        gs.best_repo, gs.star_count, gs.commit_count, gs.pr_count, gs.issue_count, gs.star_owner_count, gs.fork_owner_count, 
        st.id, st.dept, st.absence, st.plural_major,
        least(round(gs.repo_score_sub+gs.additional_score_sub,3), 5) as total_score_sub, 
        least(round(gs.repo_score_sum+gs.additional_score_sum,3), 5) as total_score_sum
        FROM github_score as gs JOIN student_tab as st ON gs.github_id = st.github_id"""
        cursor.execute(select_sql+suffix)
        result = cursor.fetchall()

        studentData = [[], [], []]
        studentRepo = [{}, {}, {}]
        
        deptDict = { "소프트웨어학과": 0, "글로벌융합학부": 1, "컴퓨터공학과": 2 }
        # Year Data: Mean, Var, Std
        scoreAnnual = [0, 0, 0]
        scoreSubAnnual = [0, 0, 0]
        scoreSumAnnual = [0, 0, 0]
        commitAnnual = [0, 0, 0]
        starAnnual = [0, 0, 0]
        prAnnual = [0, 0, 0]
        issueAnnual = [0, 0, 0]
        forkAnnual = [0, 0, 0]

        # Overview Data 
        scoreMore3 = [0, 0, 0]
        scoreSubMore3 = [0, 0, 0]
        scoreSumMore3 = [0, 0, 0]
        totalCommit = [0, 0, 0]
        totalStar = [0, 0, 0]
        repoDist = [0, 0, 0, 0, 0, 0, 0]

        # Chart Data: Score, Commits, Stars, PRs, Issues 
        annualCnt = [0, 0, 0]
        sidSize = create2DArray(3, 7)
        deptSize = create2DArray(3, 3)

        # About Score
        scoreDist = create2DArray(3, 10)
        scoreDept = create2DArray(3, 3)
        scoreSid = create2DArray(3, 7)
        # About Score sub
        scoreSubDist = create2DArray(3, 10)
        scoreSubDept = create2DArray(3, 3)
        scoreSubSid = create2DArray(3, 7)
        # About Score sub
        scoreSumDist = create2DArray(3, 10)
        scoreSumDept = create2DArray(3, 3)
        scoreSumSid = create2DArray(3, 7)
        # About Commit
        commitDist = create2DArray(3, 5)
        commitDept = create2DArray(3, 3)
        commitSid = create2DArray(3, 7)
        # About Star
        starDist = create2DArray(3, 5)
        starDept = create2DArray(3, 3)
        starSid = create2DArray(3, 7)
        # About PRs
        prDist = create2DArray(3, 5)
        prDept = create2DArray(3, 3)
        prSid = create2DArray(3, 7)
        # About Issues
        issueDist = create2DArray(3, 5)
        issueDept = create2DArray(3, 3)
        issueSid = create2DArray(3, 7)
        # About Forks
        forkDist = create2DArray(3, 5)
        forkDept = create2DArray(3, 3)
        forkSid = create2DArray(3, 7)

        Row = None
        idx1 = None
        idxId = None
        idxDept = None
        for ele in result:

            Row = ele
            idx1 = Row['year'] - startYear
            idxId = nowYear - math.floor(Row['id'] / 1000000)
            idxDept = deptDict[Row['dept']]
            totalCommit[idx1] += Row['commit_count']
            totalStar[idx1] += Row['star_count']
            Row['total_score'] = '{:0.1f}'.format(
                Row['excellent_contributor'] +
                Row['owner_score'] +
                Row['contributor_score'] +
                Row['additional_score']
            )
            
            studentData[idx1].append({
                "year": idx1+startYear,
                "github_id": Row["github_id"],
                "absence": Row["absence"],
                "plural_major": Row["plural_major"],
                "score": Row['total_score'],
                "score_diff": str(Row['total_score_sub']),
                "score_sum": str(Row['total_score_sum']),
                "commit": Row["commit_count"],
                "star": Row["star_count"],
                "pr": Row["pr_count"],
                "issue": Row["issue_count"],
                "fork": Row["fork_owner_count"],
            })
            
            total_score = float(Row['total_score'])
            total_score_sub = float(Row['total_score_sub'])
            total_score_sum = float(Row['total_score_sum'])
            # student id 
            scoreSid[idx1][idxId] += total_score
            scoreSubSid[idx1][idxId] += total_score_sub
            scoreSumSid[idx1][idxId] += total_score_sum
            commitSid[idx1][idxId] += Row['commit_count']
            starSid[idx1][idxId] += Row['star_count']
            prSid[idx1][idxId] += Row['pr_count']
            issueSid[idx1][idxId] += Row['issue_count']
            forkSid[idx1][idxId] += Row['fork_owner_count']
            sidSize[idx1][idxId] += 1
            # dept 
            scoreDept[idx1][idxDept] += total_score
            scoreSubDept[idx1][idxDept] += total_score_sub
            scoreSumDept[idx1][idxDept] += total_score_sum
            commitDept[idx1][idxDept] += Row['commit_count']
            starDept[idx1][idxDept] += Row['star_count']
            prDept[idx1][idxDept] += Row['pr_count']
            issueDept[idx1][idxDept] += Row['issue_count']
            forkDept[idx1][idxDept] += Row['fork_owner_count']
            deptSize[idx1][idxDept] += 1
            
            if total_score < 0.5 :
                scoreDist[idx1][0] += 1
            elif total_score < 1 :
                scoreDist[idx1][1] += 1
            elif total_score < 1.5 :
                scoreDist[idx1][2] += 1
            elif total_score < 2:
                scoreDist[idx1][3] += 1
            elif total_score < 2.5 :
                scoreDist[idx1][4] += 1
            elif total_score < 3 :
                scoreDist[idx1][5] += 1
            elif total_score < 3.5 :
                scoreDist[idx1][6] += 1
                scoreMore3[idx1] += 1
            elif total_score < 4 :
                scoreDist[idx1][7] += 1
                scoreMore3[idx1] += 1
            elif total_score < 4.5 :
                scoreDist[idx1][8] += 1
                scoreMore3[idx1] += 1
            else :
                scoreDist[idx1][9] += 1
                scoreMore3[idx1] += 1


            if total_score_sub < 0.5 :
                scoreSubDist[idx1][0] += 1
            elif total_score_sub < 1 :
                scoreSubDist[idx1][1] += 1
            elif total_score_sub < 1.5 :
                scoreSubDist[idx1][2] += 1
            elif total_score_sub < 2 :
                scoreSubDist[idx1][3] += 1
            elif total_score_sub < 2.5 :
                scoreSubDist[idx1][4] += 1
            elif total_score_sub < 3 :
                scoreSubDist[idx1][5] += 1
            elif total_score_sub < 3.5 :
                scoreSubDist[idx1][6] += 1
                scoreSubMore3[idx1] += 1
            elif total_score_sub < 4 :
                scoreSubDist[idx1][7] += 1
                scoreSubMore3[idx1] += 1
            elif total_score_sub < 4.5 :
                scoreSubDist[idx1][8] += 1
                scoreSubMore3[idx1] += 1
            else :
                scoreSubDist[idx1][9] += 1
                scoreSubMore3[idx1] += 1

            if total_score_sum < 0.5 :
                scoreSumDist[idx1][0] += 1
            elif total_score_sum < 1 :
                scoreSumDist[idx1][1] += 1
            elif total_score_sum < 1.5 :
                scoreSumDist[idx1][2] += 1
            elif total_score_sum < 2 :
                scoreSumDist[idx1][3] += 1
            elif total_score_sum < 2.5 :
                scoreSumDist[idx1][4] += 1
            elif total_score_sum < 3 :
                scoreSumDist[idx1][5] += 1
            elif total_score_sum < 3.5 :
                scoreSumDist[idx1][6] += 1
                scoreSumMore3[idx1] += 1
            elif total_score_sum < 4 :
                scoreSumDist[idx1][7] += 1
                scoreSumMore3[idx1] += 1
            elif total_score_sum < 4.5 :
                scoreSumDist[idx1][8] += 1
                scoreSumMore3[idx1] += 1
            else :
                scoreSumDist[idx1][9] += 1
                scoreSumMore3[idx1] += 1

            if Row['commit_count'] < 100 :
                commitDist[idx1][0] += 1
            elif Row['commit_count'] < 200 :
                commitDist[idx1][1] += 1
            elif Row['commit_count'] < 300 :
                commitDist[idx1][2] += 1
            elif Row['commit_count'] < 400 :
                commitDist[idx1][3] += 1
            else :
                commitDist[idx1][4] += 1

            if Row['star_count'] < 2 :
                starDist[idx1][0] += 1
            elif Row['star_count'] < 4 :
                starDist[idx1][1] += 1
            elif Row['star_count'] < 6 :
                starDist[idx1][2] += 1
            elif Row['star_count'] < 8 :
                starDist[idx1][3] += 1
            else :
                starDist[idx1][4] += 1

            if Row['pr_count'] < 5 :
                prDist[idx1][0] += 1
            elif Row['pr_count'] < 10 :
                prDist[idx1][1] += 1
            elif Row['pr_count'] < 15 :
                prDist[idx1][2] += 1
            elif Row['pr_count'] < 20 :
                prDist[idx1][3] += 1
            else :
                prDist[idx1][4] += 1

            if Row['issue_count'] < 2 :
                issueDist[idx1][0] += 1
            elif Row['issue_count'] < 4 :
                issueDist[idx1][1] += 1
            elif Row['issue_count'] < 6 :
                issueDist[idx1][2] += 1
            elif Row['issue_count'] < 8 :
                issueDist[idx1][3] += 1
            else :
                issueDist[idx1][4] += 1

            if Row['fork_owner_count'] < 1 :
                forkDist[idx1][0] += 1
            elif Row['fork_owner_count'] < 2 :
                forkDist[idx1][1] += 1
            elif Row['fork_owner_count'] < 3 :
                forkDist[idx1][2] += 1
            elif Row['fork_owner_count'] < 4 :
                forkDist[idx1][3] += 1
            else :
                forkDist[idx1][4] += 1

            # annual Total sum
            scoreAnnual[idx1] += total_score
            scoreSubAnnual[idx1] += total_score_sub
            scoreSumAnnual[idx1] += total_score_sum
            commitAnnual[idx1] += Row['commit_count']
            starAnnual[idx1] += Row['star_count']
            prAnnual[idx1] += Row['pr_count']
            issueAnnual[idx1] += Row['issue_count']
            forkAnnual[idx1] += Row['fork_owner_count']
            annualCnt[idx1] += 1

        # 상위 5%의 데이터 셋 만들기 
        scoreSidTop5pct = create2DArray_a(3, 7)
        scoreDeptTop5pct = create2DArray_a(3, 3)
        scoreSubSidTop5pct = create2DArray_a(3, 7)
        scoreSubDeptTop5pct = create2DArray_a(3, 3)
        scoreSumSidTop5pct = create2DArray_a(3, 7)
        scoreSumDeptTop5pct = create2DArray_a(3, 3)
        commitSidTop5pct = create2DArray_a(3, 7)
        commitDeptTop5pct = create2DArray_a(3, 3)
        starSidTop5pct = create2DArray_a(3, 7)
        starDeptTop5pct = create2DArray_a(3, 3)
        prSidTop5pct = create2DArray_a(3, 7)
        prDeptTop5pct = create2DArray_a(3, 3)
        issueSidTop5pct = create2DArray_a(3, 7)
        issueDeptTop5pct = create2DArray_a(3, 3)
        forkSidTop5pct = create2DArray_a(3, 7)
        forkDeptTop5pct = create2DArray_a(3, 3)

        for ele in result:
            Row = ele
            idx1 = Row['year'] - startYear
            idxId = nowYear - math.floor(Row['id'] / 1000000)
            idxDept = deptDict[Row['dept']]
            sidmax = int((sidSize[idx1][idxId] * 5) / 100) + 1
            deptmax = int((deptSize[idx1][idxDept] * 5) / 100) + 1
            
            # score -- student id
            total_score = float(Row['total_score'])
            if total_score > 0 :
                list_len = len(scoreSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    scoreSidTop5pct[idx1][idxId].append(total_score)
                elif sidmax > list_len:
                    if total_score < scoreSidTop5pct[idx1][idxId][0] :
                        scoreSidTop5pct[idx1][idxId].insert(0, total_score)
                    else :
                        for p in range(list_len) :
                            if scoreSidTop5pct[idx1][idxId][p] > total_score :
                                offset=0
                                break
                        scoreSidTop5pct[idx1][idxId].insert(p+offset, total_score)
                else :
                    if total_score > scoreSidTop5pct[idx1][idxId][sidmax-1] :
                        scoreSidTop5pct[idx1][idxId].pop(0)
                        scoreSidTop5pct[idx1][idxId].append(total_score)
                    elif total_score > scoreSidTop5pct[idx1][idxId][0] :
                        scoreSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1):
                            if scoreSidTop5pct[idx1][idxId][p] > total_score :
                                offset=0
                                break
                        scoreSidTop5pct[idx1][idxId].insert(p+offset, total_score)
                    
                # score -- department
                list_len = len(scoreDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    scoreDeptTop5pct[idx1][idxDept].append(total_score)
                elif deptmax > list_len :
                    if total_score < scoreDeptTop5pct[idx1][idxDept][0] :
                        scoreDeptTop5pct[idx1][idxDept].insert(0, total_score)
                    else :
                        for p in range(list_len):
                            if scoreDeptTop5pct[idx1][idxDept][p] > total_score :
                                offset=0
                                break
                        scoreDeptTop5pct[idx1][idxDept].insert(p+offset, total_score)
                else :
                    if total_score > scoreDeptTop5pct[idx1][idxDept][deptmax-1] :
                        scoreDeptTop5pct[idx1][idxDept].pop(0)
                        scoreDeptTop5pct[idx1][idxDept].append(total_score)
                    elif total_score > scoreDeptTop5pct[idx1][idxDept][0] :
                        scoreDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if scoreDeptTop5pct[idx1][idxDept][p] > total_score :
                                offset=0
                                break
                        scoreDeptTop5pct[idx1][idxDept].insert(p+offset, total_score)
                    
            # score sub -- student id
            total_score_sub = float(Row['total_score_sub'])
            if total_score_sub > 0:
                list_len = len(scoreSubSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    scoreSubSidTop5pct[idx1][idxId].append(total_score_sub)
                elif sidmax > list_len :
                    if total_score_sub < scoreSubSidTop5pct[idx1][idxId][0] :
                        scoreSubSidTop5pct[idx1][idxId].insert(0, total_score_sub)
                    else :
                        for p in range(list_len): 
                            if scoreSubSidTop5pct[idx1][idxId][p] > total_score_sub :
                                offset=0
                                break
                        scoreSubSidTop5pct[idx1][idxId].insert(p+offset, total_score_sub)
                else :
                    if total_score_sub > scoreSubSidTop5pct[idx1][idxId][sidmax-1] :
                        scoreSubSidTop5pct[idx1][idxId].pop(0)
                        scoreSubSidTop5pct[idx1][idxId].append(total_score_sub)
                    elif total_score_sub > scoreSubSidTop5pct[idx1][idxId][0] :
                        scoreSubSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1):
                            if scoreSubSidTop5pct[idx1][idxId][p] > total_score_sub :
                                offset=0
                                break
                        scoreSubSidTop5pct[idx1][idxId].insert(p+offset, total_score_sub)
                # score sub -- department
                list_len = len(scoreSubDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    scoreSubDeptTop5pct[idx1][idxDept].append(total_score_sub)
                elif deptmax > list_len :
                    if total_score_sub < scoreSubDeptTop5pct[idx1][idxDept][0] :
                        scoreSubDeptTop5pct[idx1][idxDept].insert(0, total_score_sub)
                    else :
                        for p in range(list_len):
                            if scoreSubDeptTop5pct[idx1][idxDept][p] > total_score_sub :
                                offset=0
                                break
                        scoreSubDeptTop5pct[idx1][idxDept].insert(p+offset, total_score_sub)
                else :
                    if total_score_sub > scoreSubDeptTop5pct[idx1][idxDept][deptmax-1]:
                        scoreSubDeptTop5pct[idx1][idxDept].pop(0)
                        scoreSubDeptTop5pct[idx1][idxDept].append(total_score_sub)
                    elif total_score_sub > scoreSubDeptTop5pct[idx1][idxDept][0]:
                        scoreSubDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1):
                            if scoreSubDeptTop5pct[idx1][idxDept][p] > total_score_sub :
                                offset=0
                                break
                        scoreSubDeptTop5pct[idx1][idxDept].insert(p+offset, total_score_sub)

            # score sum -- student id
            total_score_sum = float(Row['total_score_sum'])
            offset = 1
            if total_score_sum > 0 :
                list_len = len(scoreSumSidTop5pct[idx1][idxId])
                if list_len <= 0:
                    scoreSumSidTop5pct[idx1][idxId].append(total_score_sum)
                elif sidmax > list_len:
                    if total_score_sum < scoreSumSidTop5pct[idx1][idxId][0] :
                        scoreSumSidTop5pct[idx1][idxId].insert(0, total_score_sum)
                    else :
                        for p in range(list_len): 
                            if scoreSumSidTop5pct[idx1][idxId][p] > total_score_sum :
                                offset=0
                                break
                        scoreSumSidTop5pct[idx1][idxId].insert(p+offset, total_score_sum)
                else :
                    if total_score_sum > scoreSumSidTop5pct[idx1][idxId][sidmax-1] :
                        scoreSumSidTop5pct[idx1][idxId].pop(0)
                        scoreSumSidTop5pct[idx1][idxId].append(total_score_sum)
                    elif total_score_sum > scoreSumSidTop5pct[idx1][idxId][0] :
                        scoreSumSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1) :
                            if scoreSumSidTop5pct[idx1][idxId][p] > total_score_sum :
                                offset=0
                                break
                        scoreSumSidTop5pct[idx1][idxId].insert(p+offset, total_score_sum)

                # score sum -- department
                list_len = len(scoreSumDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    scoreSumDeptTop5pct[idx1][idxDept].append(total_score_sum)
                elif deptmax > list_len :
                    if total_score_sum < scoreSumDeptTop5pct[idx1][idxDept][0] :
                        scoreSumDeptTop5pct[idx1][idxDept].insert(0, total_score_sum)
                    else :
                        for p in range(list_len) :
                            if scoreSumDeptTop5pct[idx1][idxDept][p] > total_score_sum :
                                offset=0
                                break
                        scoreSumDeptTop5pct[idx1][idxDept].insert(p+offset,total_score_sum)
                else :
                    if total_score_sum > scoreSumDeptTop5pct[idx1][idxDept][deptmax-1]:
                        scoreSumDeptTop5pct[idx1][idxDept].pop(0)
                        scoreSumDeptTop5pct[idx1][idxDept].append(total_score_sum)
                    elif total_score_sum > scoreSumDeptTop5pct[idx1][idxDept][0] :
                        scoreSumDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if scoreSumDeptTop5pct[idx1][idxDept][p] > total_score_sum :
                                offset=0
                                break
                        scoreSumDeptTop5pct[idx1][idxDept].insert(p+offset, total_score_sum)

            # commit -- student id
            if Row['commit_count'] > 0 :
                list_len = len(commitSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    commitSidTop5pct[idx1][idxId].append(Row['commit_count'])
                elif sidmax > list_len :
                    if Row['commit_count'] < commitSidTop5pct[idx1][idxId][0] :
                        commitSidTop5pct[idx1][idxId].insert(0, Row['commit_count'])
                    else :
                        for p in range(list_len):
                            if commitSidTop5pct[idx1][idxId][p] > Row['commit_count'] :
                                offset=0
                                break
                        commitSidTop5pct[idx1][idxId].insert(p+offset, Row['commit_count'])
                else :
                    if Row['commit_count'] > commitSidTop5pct[idx1][idxId][sidmax-1] :
                        commitSidTop5pct[idx1][idxId].pop(0)
                        commitSidTop5pct[idx1][idxId].append(Row['commit_count'])
                    elif Row['commit_count'] > commitSidTop5pct[idx1][idxId][0] :
                        commitSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1) :
                            if commitSidTop5pct[idx1][idxId][p] > Row['commit_count'] :
                                offset=0
                                break
                        commitSidTop5pct[idx1][idxId].insert(p+offset, Row['commit_count'])
                #commit -- department
                list_len = len(commitDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    commitDeptTop5pct[idx1][idxDept].append(Row['commit_count'])
                elif deptmax > list_len :
                    if Row['commit_count'] < commitDeptTop5pct[idx1][idxDept][0] :
                        commitDeptTop5pct[idx1][idxDept].insert(0, Row['commit_count'])
                    else :
                        for p in range(list_len) :
                            if commitDeptTop5pct[idx1][idxDept][p] > Row['commit_count'] :
                                offset=0
                                break
                        commitDeptTop5pct[idx1][idxDept].insert(p+offset, Row['commit_count'])
                else :
                    if Row['commit_count'] > commitDeptTop5pct[idx1][idxDept][deptmax-1] :
                        commitDeptTop5pct[idx1][idxDept].pop(0)
                        commitDeptTop5pct[idx1][idxDept].append(Row['commit_count'])
                    elif Row['commit_count'] > commitDeptTop5pct[idx1][idxDept][0] :
                        commitDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if commitDeptTop5pct[idx1][idxDept][p] > Row['commit_count'] :
                                offset=0
                                break
                        commitDeptTop5pct[idx1][idxDept].insert(p+offset, Row['commit_count'])

            # star -- student id
            if Row['star_count'] > 0 :
                list_len = len(starSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    starSidTop5pct[idx1][idxId].append(Row['star_count'])
                elif sidmax > list_len :
                    if Row['star_count'] < starSidTop5pct[idx1][idxId][0] :
                        starSidTop5pct[idx1][idxId].insert(0, Row['star_count'])
                    else :
                        for p in range(list_len) :
                            if starSidTop5pct[idx1][idxId][p] > Row['star_count'] :
                                offset=0
                                break
                        starSidTop5pct[idx1][idxId].insert(p+offset, Row['star_count'])
                else :
                    if Row['star_count'] > starSidTop5pct[idx1][idxId][sidmax-1] :
                        starSidTop5pct[idx1][idxId].pop(0)
                        starSidTop5pct[idx1][idxId].append(Row['star_count'])
                    elif Row['star_count'] > starSidTop5pct[idx1][idxId][0] :
                        starSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1) :
                            if starSidTop5pct[idx1][idxId][p] > Row['star_count'] :
                                offset=0
                                break
                        starSidTop5pct[idx1][idxId].insert(p+offset, Row['star_count'])
                # star -- department
                list_len = len(starDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    starDeptTop5pct[idx1][idxDept].append(Row['star_count'])
                elif deptmax > list_len :
                    if Row['star_count'] < starDeptTop5pct[idx1][idxDept][0] :
                        starDeptTop5pct[idx1][idxDept].insert(0, Row['star_count'])
                    else :
                        for p in range(list_len) :
                            if starDeptTop5pct[idx1][idxDept][p] > Row['star_count'] :
                                offset=0
                                break
                        starDeptTop5pct[idx1][idxDept].insert(p+offset, Row['star_count'])
                else :
                    if Row['star_count'] > starDeptTop5pct[idx1][idxDept][deptmax-1] :
                        starDeptTop5pct[idx1][idxDept].pop(0)
                        starDeptTop5pct[idx1][idxDept].append(Row['star_count'])
                    elif Row['star_count'] > starDeptTop5pct[idx1][idxDept][0] :
                        starDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if starDeptTop5pct[idx1][idxDept][p] > Row['star_count'] :
                                offset=0
                                break
                        starDeptTop5pct[idx1][idxDept].insert(p+offset, Row['star_count'])
            # prs -- student id
            if Row['pr_count'] > 0 :
                list_len = len(prSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    prSidTop5pct[idx1][idxId].append(Row['pr_count'])
                elif sidmax > list_len :
                    if Row['pr_count'] < prSidTop5pct[idx1][idxId][0] :
                        prSidTop5pct[idx1][idxId].insert(0, Row['pr_count'])
                    else :
                        for p in range(list_len) :
                            if prSidTop5pct[idx1][idxId][p] > Row['pr_count'] :
                                offset=0
                                break
                        prSidTop5pct[idx1][idxId].insert(p+offset, Row['pr_count'])
                else :
                    if Row['pr_count'] > prSidTop5pct[idx1][idxId][sidmax-1] :
                        prSidTop5pct[idx1][idxId].pop(0)
                        prSidTop5pct[idx1][idxId].append(Row['pr_count'])
                    elif Row['pr_count'] > prSidTop5pct[idx1][idxId][0] :
                        prSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1) :
                            if prSidTop5pct[idx1][idxId][p] > Row['pr_count'] :
                                offset=0
                                break
                        prSidTop5pct[idx1][idxId].insert(p+offset, Row['pr_count'])
                # prs -- department
                list_len = len(prDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    prDeptTop5pct[idx1][idxDept].append(Row['pr_count'])
                elif deptmax > list_len :
                    if Row['pr_count'] < prDeptTop5pct[idx1][idxDept][0] :
                        prDeptTop5pct[idx1][idxDept].insert(0, Row['pr_count'])
                    else :
                        for p in range(list_len) :
                            if prDeptTop5pct[idx1][idxDept][p] > Row['pr_count'] :
                                offset=0
                                break
                        prDeptTop5pct[idx1][idxDept].insert(p+offset, Row['pr_count'])
                else :
                    if Row['pr_count'] > prDeptTop5pct[idx1][idxDept][deptmax-1] :
                        prDeptTop5pct[idx1][idxDept].pop(0)
                        prDeptTop5pct[idx1][idxDept].append(Row['pr_count'])
                    elif Row['pr_count'] > prDeptTop5pct[idx1][idxDept][0] :
                        prDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if prDeptTop5pct[idx1][idxDept][p] > Row['pr_count'] :
                                offset=0
                                break
                        prDeptTop5pct[idx1][idxDept].insert(p+offset, Row['pr_count'])
            # issue -- student id
            if Row['issue_count'] > 0 :
                list_len = len(issueSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    issueSidTop5pct[idx1][idxId].append(Row['issue_count'])
                elif sidmax > list_len :
                    if Row['issue_count'] < issueSidTop5pct[idx1][idxId][0] :
                        issueSidTop5pct[idx1][idxId].insert(0, Row['issue_count'])
                    else :
                        for p in range(list_len) :
                            if issueSidTop5pct[idx1][idxId][p] > Row['issue_count'] :
                                offset=0
                                break
                        issueSidTop5pct[idx1][idxId].insert(p+offset, Row['issue_count'])
                else :
                    if Row['issue_count'] > issueSidTop5pct[idx1][idxId][sidmax-1] :
                        issueSidTop5pct[idx1][idxId].pop(0)
                        issueSidTop5pct[idx1][idxId].append(Row['issue_count'])
                    elif Row['issue_count'] > issueSidTop5pct[idx1][idxId][0] :
                        issueSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1) :
                            if issueSidTop5pct[idx1][idxId][p] > Row['issue_count'] :
                                offset=0
                                break
                        issueSidTop5pct[idx1][idxId].insert(p+offset, Row['issue_count'])
                # issue -- department
                list_len = len(issueDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    issueDeptTop5pct[idx1][idxDept].append(Row['issue_count'])
                elif deptmax > list_len :
                    if Row['issue_count'] < issueDeptTop5pct[idx1][idxDept][0] :
                        issueDeptTop5pct[idx1][idxDept].insert(0, Row['issue_count'])
                    else :
                        for p in range(list_len) :
                            if issueDeptTop5pct[idx1][idxDept][p] > Row['issue_count'] :
                                offset=0
                                break
                        issueDeptTop5pct[idx1][idxDept].insert(p+offset, Row['issue_count'])
                else :
                    if Row['issue_count'] > issueDeptTop5pct[idx1][idxDept][deptmax-1] :
                        issueDeptTop5pct[idx1][idxDept].pop(0)
                        issueDeptTop5pct[idx1][idxDept].append(Row['issue_count'])
                    elif Row['issue_count'] > issueDeptTop5pct[idx1][idxDept][0] :
                        issueDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if issueDeptTop5pct[idx1][idxDept][p] > Row['issue_count'] :
                                offset=0
                                break
                        issueDeptTop5pct[idx1][idxDept].insert(p+offset, Row['issue_count'])
            # fork -- student id
            if Row['fork_owner_count'] > 0:
                list_len = len(forkSidTop5pct[idx1][idxId])
                offset = 1
                if list_len <= 0:
                    forkSidTop5pct[idx1][idxId].append(Row['fork_owner_count'])
                elif sidmax > list_len :
                    if Row['fork_owner_count'] < forkSidTop5pct[idx1][idxId][0] :
                        forkSidTop5pct[idx1][idxId].insert(0, Row['fork_owner_count'])
                    else :
                        for p in range(list_len) :
                            if forkSidTop5pct[idx1][idxId][p] > Row['fork_owner_count'] :
                                offset=0
                                break
                        forkSidTop5pct[idx1][idxId].insert(p+offset, Row['fork_owner_count'])
                else :
                    if Row['fork_owner_count'] > forkSidTop5pct[idx1][idxId][sidmax-1] :
                        forkSidTop5pct[idx1][idxId].pop(0)
                        forkSidTop5pct[idx1][idxId].append(Row['fork_owner_count'])
                    elif Row['fork_owner_count'] > forkSidTop5pct[idx1][idxId][0] :
                        forkSidTop5pct[idx1][idxId].pop(0)
                        for p in range(sidmax-1) :
                            if forkSidTop5pct[idx1][idxId][p] > Row['fork_owner_count'] :
                                offset=0
                                break
                        forkSidTop5pct[idx1][idxId].insert(p+offset, Row['fork_owner_count'])
                # fork -- department
                list_len = len(forkDeptTop5pct[idx1][idxDept])
                offset = 1
                if list_len <= 0:
                    forkDeptTop5pct[idx1][idxDept].append(Row['fork_owner_count'])
                elif deptmax > list_len:
                    if Row['fork_owner_count'] < forkDeptTop5pct[idx1][idxDept][0] :
                        forkDeptTop5pct[idx1][idxDept].insert(0, Row['fork_owner_count'])
                    else :
                        for p in range(list_len) :
                            if forkDeptTop5pct[idx1][idxDept][p] > Row['fork_owner_count'] :
                                offset=0
                                break
                        forkDeptTop5pct[idx1][idxDept].insert(p+offset, Row['fork_owner_count'])
                else :
                    if Row['fork_owner_count'] > forkDeptTop5pct[idx1][idxDept][deptmax-1] :
                        forkDeptTop5pct[idx1][idxDept].pop(0)
                        forkDeptTop5pct[idx1][idxDept].append(Row['fork_owner_count'])
                    elif Row['fork_owner_count'] > forkDeptTop5pct[idx1][idxDept][0] :
                        forkDeptTop5pct[idx1][idxDept].pop(0)
                        for p in range(deptmax-1) :
                            if forkDeptTop5pct[idx1][idxDept][p] > Row['fork_owner_count'] :
                                offset=0
                                break
                        forkDeptTop5pct[idx1][idxDept].insert(p+offset, Row['fork_owner_count'])

        # 학번 평균, 학과 평균 구하기 
        # object 타입으로 map함수 사용불가
        nYear = nowYear - startYear + 1
        for i in range(nYear):
            for j in range(len(scoreSid[i])):
                if sidSize[i][j] == 0:
                    continue
                scoreSid[i][j] = '{:0.2f}'.format(scoreSid[i][j] / sidSize[i][j])
                scoreSubSid[i][j] = '{:0.2f}'.format(scoreSubSid[i][j] / sidSize[i][j])
                scoreSumSid[i][j] = '{:0.2f}'.format(scoreSumSid[i][j] / sidSize[i][j])
                commitSid[i][j] = '{:0.2f}'.format(commitSid[i][j] / sidSize[i][j])
                starSid[i][j] = '{:0.2f}'.format(starSid[i][j] / sidSize[i][j])
                prSid[i][j] = '{:0.2f}'.format(prSid[i][j] / sidSize[i][j])
                issueSid[i][j] = '{:0.2f}'.format(issueSid[i][j] / sidSize[i][j])
                forkSid[i][j] = '{:0.2f}'.format(forkSid[i][j] / sidSize[i][j])

        for i in range(nYear):
            for j in range(len(scoreDept[i])):
                if deptSize[i][j] == 0:
                    continue
                scoreDept[i][j] = '{:0.2f}'.format(scoreDept[i][j] / deptSize[i][j])
                scoreSubDept[i][j] = '{:0.2f}'.format(scoreSubDept[i][j] / deptSize[i][j])
                scoreSumDept[i][j] = '{:0.2f}'.format(scoreSumDept[i][j] / deptSize[i][j])
                commitDept[i][j] = '{:0.2f}'.format(commitDept[i][j] / deptSize[i][j])
                starDept[i][j] = '{:0.2f}'.format(starDept[i][j] / deptSize[i][j])
                prDept[i][j] = '{:0.2f}'.format(prDept[i][j] / deptSize[i][j])
                issueDept[i][j] = '{:0.2f}'.format(issueDept[i][j] / deptSize[i][j])
                forkDept[i][j] = '{:0.2f}'.format(forkDept[i][j] / deptSize[i][j])

        # 연도별 점수, 커밋, 스타, pr, issue 평균 계산
        scoreMean = calculateMeanOfArray(scoreAnnual)
        scoreSubMean = calculateMeanOfArray(scoreSubAnnual)
        scoreSumMean = calculateMeanOfArray(scoreSumAnnual)
        commitMean = calculateMeanOfArray(commitAnnual)
        starMean = calculateMeanOfArray(starAnnual)
        prMean = calculateMeanOfArray(prAnnual)
        issueMean = calculateMeanOfArray(issueAnnual)
        forkMean = calculateMeanOfArray(forkAnnual)

        # 학번별, 학과별, 연도별에 대해 점수, 커밋, 스타, 풀리, 이슈 등 각각의 분산과 표준편차 계산 
        scoreSidDevTotal = create2DArray(3, 7)
        scoreSubSidDevTotal = create2DArray(3, 7)
        scoreSumSidDevTotal = create2DArray(3, 7)
        commitSidDevTotal = create2DArray(3, 7)
        starSidDevTotal = create2DArray(3, 7)
        prSidDevTotal = create2DArray(3, 7)
        issueSidDevTotal = create2DArray(3, 7)
        forkSidDevTotal = create2DArray(3, 7)
        scoreDeptDevTotal = create2DArray(3, 3)
        scoreSubDeptDevTotal = create2DArray(3, 3)
        scoreSumDeptDevTotal = create2DArray(3, 3)
        commitDeptDevTotal = create2DArray(3, 3)
        starDeptDevTotal = create2DArray(3, 3)
        prDeptDevTotal = create2DArray(3, 3)
        issueDeptDevTotal = create2DArray(3, 3)
        forkDeptDevTotal = create2DArray(3, 3)
        scoreYearDevTotal = [0, 0, 0]
        scoreSubYearDevTotal = [0, 0, 0]
        scoreSumYearDevTotal = [0, 0, 0]
        commitYearDevTotal = [0, 0, 0]
        starYearDevTotal = [0, 0, 0]
        prYearDevTotal = [0, 0, 0]
        issueYearDevTotal = [0, 0, 0]
        forkYearDevTotal = [0, 0, 0]

        for row in result:
            Row = row
            idx1 = Row['year'] - startYear

            # student id 
            idxId = nowYear - math.floor(Row['id'] / 1000000)
            scoreSidDevTotal[idx1][idxId] += math.pow(float(Row['total_score']) - float(scoreSid[idx1][idxId]), 2)
            scoreSubSidDevTotal[idx1][idxId] += math.pow(float(Row['total_score_sub']) - float(scoreSubSid[idx1][idxId]), 2)
            scoreSumSidDevTotal[idx1][idxId] += math.pow(float(Row['total_score_sum']) - float(scoreSumSid[idx1][idxId]), 2)
            commitSidDevTotal[idx1][idxId] += math.pow(float(Row['commit_count']) - float(commitSid[idx1][idxId]), 2)
            starSidDevTotal[idx1][idxId] += math.pow(float(Row['star_count']) - float(starSid[idx1][idxId]), 2)
            prSidDevTotal[idx1][idxId] += math.pow(float(Row['pr_count']) - float(prSid[idx1][idxId]), 2)
            issueSidDevTotal[idx1][idxId] += math.pow(float(Row['issue_count']) - float(issueSid[idx1][idxId]), 2)
            forkSidDevTotal[idx1][idxId] += math.pow(float(Row['fork_owner_count']) - float(forkSid[idx1][idxId]), 2)

            # dept 
            idxDept = deptDict[Row['dept']]
            scoreDeptDevTotal[idx1][idxDept] += math.pow(float(Row['total_score']) - float(scoreDept[idx1][idxDept]),2)
            scoreSubDeptDevTotal[idx1][idxDept] += math.pow(float(Row['total_score_sub']) - float(scoreSubDept[idx1][idxDept]),2)
            scoreSumDeptDevTotal[idx1][idxDept] += math.pow(float(Row['total_score_sum']) - float(scoreSumDept[idx1][idxDept]),2)
            commitDeptDevTotal[idx1][idxDept] += math.pow(float(Row['commit_count']) - float(commitDept[idx1][idxDept]),2)
            starDeptDevTotal[idx1][idxDept] += math.pow(float(Row['star_count']) - float(starDept[idx1][idxDept]),2)
            prDeptDevTotal[idx1][idxDept] += math.pow(float(Row['pr_count']) - float(prDept[idx1][idxDept]),2)
            issueDeptDevTotal[idx1][idxDept] += math.pow(float(Row['issue_count']) - float(issueDept[idx1][idxDept]),2)
            forkDeptDevTotal[idx1][idxDept] += math.pow(float(Row['fork_owner_count']) - float(forkDept[idx1][idxDept]),2)
            
            # year 
            scoreYearDevTotal[idx1] += math.pow(float(Row['total_score']) - float(scoreMean[idx1]),2)
            scoreSubYearDevTotal[idx1] += math.pow(float(Row['total_score_sub']) - float(scoreSubMean[idx1]),2)
            scoreSumYearDevTotal[idx1] += math.pow(float(Row['total_score_sum']) - float(scoreSumMean[idx1]),2)
            commitYearDevTotal[idx1] += math.pow(float(Row['commit_count']) - float(commitMean[idx1]), 2)
            starYearDevTotal[idx1] += math.pow(float(Row['star_count']) - float(starMean[idx1]),2)
            prYearDevTotal[idx1] += math.pow(float(Row['pr_count']) - float(prMean[idx1]),2)
            issueYearDevTotal[idx1] += math.pow(float(Row['issue_count']) - float(issueMean[idx1]),2)
            forkYearDevTotal[idx1] += math.pow(float(Row['fork_owner_count']) - float(forkMean[idx1]),2)

        scoreSidStd = create2DArray(3, 7)
        scoreSubSidStd = create2DArray(3, 7)
        scoreSumSidStd = create2DArray(3, 7)
        commitSidStd = create2DArray(3, 7)
        starSidStd = create2DArray(3, 7)
        prSidStd = create2DArray(3, 7)
        issueSidStd = create2DArray(3, 7)
        forkSidStd = create2DArray(3, 7)
        scoreDeptStd = create2DArray(3, 3)
        scoreSubDeptStd = create2DArray(3, 3)
        scoreSumDeptStd = create2DArray(3, 3)
        commitDeptStd = create2DArray(3, 3)
        starDeptStd = create2DArray(3, 3)
        prDeptStd = create2DArray(3, 3)
        issueDeptStd = create2DArray(3, 3)
        forkDeptStd = create2DArray(3, 3)
        scoreYearStd = [0, 0, 0]
        scoreSubYearStd = [0, 0, 0]
        scoreSumYearStd = [0, 0, 0]
        commitYearStd = [0, 0, 0]
        starYearStd = [0, 0, 0]
        prYearStd = [0, 0, 0]
        issueYearStd = [0, 0, 0]
        forkYearStd = [0, 0, 0]

        for i in range(nYear):
            for j in range(7) :
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
                    scoreSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(scoreSidDevTotal[i][j] / sidSize[i][j])))
                    scoreSubSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(scoreSubSidDevTotal[i][j] / sidSize[i][j])))
                    scoreSumSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(scoreSumSidDevTotal[i][j] / sidSize[i][j])))
                    commitSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(commitSidDevTotal[i][j] / sidSize[i][j])))
                    starSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(starSidDevTotal[i][j] / sidSize[i][j])))
                    prSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(prSidDevTotal[i][j] / sidSize[i][j])))
                    issueSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(issueSidDevTotal[i][j] / sidSize[i][j])))
                    forkSidStd[i][j] = '{:0.4f}'.format(math.sqrt(float(forkSidDevTotal[i][j] / sidSize[i][j])))
                
        for i in range(nYear) :
            for j in range(3) :
                if sidSize[i][j] == 0:
                    scoreDeptStd[i][j] = "NaN"
                    scoreSubDeptStd[i][j] = "NaN"
                    scoreSumDeptStd[i][j] = "NaN"
                    commitDeptStd[i][j] = "NaN"
                    starDeptStd[i][j] = "NaN"
                    prDeptStd[i][j] = "NaN"
                    issueDeptStd[i][j] = "NaN"
                    forkDeptStd[i][j] = "NaN"
                else:
                    scoreDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(scoreDeptDevTotal[i][j] / deptSize[i][j])))
                    scoreSubDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(scoreSubDeptDevTotal[i][j] / deptSize[i][j])))
                    scoreSumDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(scoreSumDeptDevTotal[i][j] / deptSize[i][j])))
                    commitDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(commitDeptDevTotal[i][j] / deptSize[i][j])))
                    starDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(starDeptDevTotal[i][j] / deptSize[i][j])))
                    prDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(prDeptDevTotal[i][j] / deptSize[i][j])))
                    issueDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(issueDeptDevTotal[i][j] / deptSize[i][j])))
                    forkDeptStd[i][j] = '{:0.4f}'.format(math.sqrt(float(forkDeptDevTotal[i][j] / deptSize[i][j])))

        for i in range(nYear) :
            if sidSize[i] == 0:
                scoreYearStd[i] = "NaN"
                scoreSubYearStd[i] = "NaN"
                scoreSumYearStd[i] = "NaN"
                commitYearStd[i] = "NaN"
                starYearStd[i] = "NaN"
                prYearStd[i] = "NaN"
                issueYearStd[i] = "NaN"
                forkYearStd[i] = "NaN"
            else:
                scoreYearStd[i] = '{:0.4f}'.format(math.sqrt(float(scoreYearDevTotal[i] / annualCnt[i])))
                scoreSubYearStd[i] = '{:0.4f}'.format(math.sqrt(float(scoreSubYearDevTotal[i] / annualCnt[i])))
                scoreSumYearStd[i] = '{:0.4f}'.format(math.sqrt(float(scoreSumYearDevTotal[i] / annualCnt[i])))
                commitYearStd[i] = '{:0.4f}'.format(math.sqrt(float(commitYearDevTotal[i] / annualCnt[i])))
                starYearStd[i] = '{:0.4f}'.format(math.sqrt(float(starYearDevTotal[i] / annualCnt[i])))
                prYearStd[i] = '{:0.4f}'.format(math.sqrt(float(prYearDevTotal[i] / annualCnt[i])))
                issueYearStd[i] = '{:0.4f}'.format(math.sqrt(float(issueYearDevTotal[i] / annualCnt[i])))
                forkYearStd[i] = '{:0.4f}'.format(math.sqrt(float(forkYearDevTotal[i] / annualCnt[i])))
        
        # MODEL1: insert_annualoverview_sql
        if mask & 1:
            print("exec sql annualoverview")
            try:
                insert_annualoverview_sql = """insert into home_annualoverview 
                (case_num, score, score_diff, score_sum, score_std, score_std_diff, score_std_sum, 
                commit, commit_std, star, star_std, pr, pr_std, issue, issue_std, fork, fork_std) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                
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
                insert_annualtotal_sql = """insert into home_annualtotal 
                (case_num, student_KP, student_KP_diff, student_KP_sum, student_total, commit, star, repo, repo_total) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                
                cursor.execute(insert_annualtotal_sql, 
                    (case, json.dumps(scoreMore3), json.dumps(scoreSubMore3), json.dumps(scoreSumMore3), json.dumps(annualCnt),json.dumps(totalCommit), json.dumps(totalStar), json.dumps(repo_dist), repo_total))
                conn.commit()
            except Exception as e:
                print("insert_annualtotal_sql ", e)
            
        
        # MODEL3: insert_distscore_sql
        if mask & 4:
            print("exec sql distscore")
            try:
                insert_distscore_sql = """insert into home_distscore 
                (case_num, year, score, score_diff, score_sum, 
                score_sid, score_sid_diff, score_sid_sum, score_sid_std, score_sid_std_diff, score_sid_std_sum, score_sid_pct, score_sid_pct_diff, score_sid_pct_sum, 
                score_dept, score_dept_diff, score_dept_sum, score_dept_std, score_dept_std_diff, score_dept_std_sum, score_dept_pct, score_dept_pct_diff, score_dept_pct_sum) 
                VALUES (%s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
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
                insert_distfactor_sql = """insert into home_distfactor 
                (case_num, year, factor, value,
                value_sid, value_sid_std, value_sid_pct,
                value_dept, value_dept_std, value_dept_pct) 
                VALUES (%s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s)"""
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
                    cursor.execute(insert_distfactor_sql, 
                    (case, yid+startYear, "fork", json.dumps(forkDist[yid]), 
                    json.dumps(forkSid[yid]), json.dumps(forkSidStd[yid]), json.dumps(forkSidTop5pct[yid]), 
                    json.dumps(forkDept[yid]), json.dumps(forkDeptStd[yid]), json.dumps(forkDeptTop5pct[yid])))
                conn.commit()
            except Exception as e:
                print("insert_distfactor_sql ", e)

        # MODEL5: insert_student_sql
        if (mask & 16) and suffix == "":
            print("exec sql student")
            try:
                insert_student_sql = """insert into home_student 
                (year, github_id, absence, plural_major, score, score_diff, score_sum, commit, star, pr, issue, fork) 
                VALUES (%(year)s, %(github_id)s, %(absence)s, %(plural_major)s, %(score)s, %(score_diff)s, %(score_sum)s, %(commit)s, %(star)s, %(pr)s, %(issue)s, %(fork)s)"""
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