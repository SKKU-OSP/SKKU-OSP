import pandas as pd
import numpy as np
import os
from scipy.stats import circmean
import datetime
from user.models import GithubRepoCommits, GithubRepoStats, DevType, StudentTab

commit_lines_limit = 1000



def update_commmit_time():
    def time_to_seconds(hour_min_sec):
        time = datetime.datetime.strptime(str(hour_min_sec), '%Y-%m-%d %H:%M:%S').strftime('%H:%M:%S')
        hour = int(time.split(':')[0])
        minute = int(time.split(':')[1])
        sec = int(time.split(':')[2])
        return hour*3600 + minute*60 + sec

    def cal_circmean(df):
        circular_mean = circmean(df['committer_time']+32400, high=86399, low=0, axis=None, nan_policy='propagate')
        return(circular_mean)

    users = pd.DataFrame(StudentTab.objects.all().values())
    usernames = users.loc[:,['github_id']]


    def check_student(unknown_id):
        checker = int(usernames[usernames['github_id']==unknown_id].count())
        if checker > 0:
            return True
        else:
            return False

    student_commits_time = pd.DataFrame(GithubRepoCommits.objects.all().values())

    student_commits_time = student_commits_time.loc[:, ['additions', 'deletions', 'committer_date', 'committer', 'author_github','committer_github' ]]

    student_commits_time = student_commits_time[student_commits_time['additions'] < commit_lines_limit] # 한 커밋에 commit_lines_limit개 이상 추가 한 커밋 삭제
    student_commits_time = student_commits_time[student_commits_time['deletions'] < commit_lines_limit] # 한 커밋에 commit_lines_limit개 이상 삭제 한 커밋 삭제
    student_commits_time['committer_time'] = student_commits_time['committer_date'].map(time_to_seconds)

    student_commits_time['is_student'] = 0
    student_commits_time['is_student'] = student_commits_time['committer_github'].map(check_student) | student_commits_time['author_github'].map(check_student)
    student_commits_time['committer_is_student'] = student_commits_time['committer_github'].map(check_student)
    student_commits_time['author_is_student'] = student_commits_time['author_github'].map(check_student)
    student_commits_time = student_commits_time[student_commits_time['is_student']==True]
    student_commits_time['student_github'] = ''

    for row_index in student_commits_time.index:
        if student_commits_time.loc[row_index, 'committer_is_student']:
            student_commits_time.loc[row_index, 'student_github'] = student_commits_time.loc[row_index, 'committer_github']
        elif student_commits_time.loc[row_index, 'author_is_student']:
            student_commits_time.loc[row_index, 'student_github'] = student_commits_time.loc[row_index, 'author_github']


    student_commits_time = student_commits_time.groupby(['student_github']).apply(cal_circmean)
    student_commits_time = pd.DataFrame(student_commits_time)
    student_commits_time.columns = ['committer_time_circmean']
    student_commits_time['committer_time_circmean'] = student_commits_time['committer_time_circmean'].map(int)
    sectors = []
    commit_times = []
    for i in range(24):
        sectors.append(i*3600)
        commit_times.append(0)
        
    for time in student_commits_time['committer_time_circmean']:
        commit_times[int(time/3600)] += 1

    entire_user_count = len(student_commits_time)
    max_index = np.argmax(commit_times)
    current_user_count = commit_times[max_index]

    radius = 0
    while(current_user_count/entire_user_count < 0.7):
        radius += 1
        current_user_count += commit_times[max_index - radius]
        current_user_count += commit_times[max_index + radius]

    time_sector = pd.DataFrame({'sector' : ['major_min','major_max'], 'second': [sectors[max_index-radius], sectors[max_index+radius+1]]})

    student_commits_time.reset_index().to_csv(os.getcwd() + '/static/data/committer_time_circmean.csv')
    time_sector.to_csv(os.getcwd() + '/static/data/time_sector.csv')

    # ORM으로 DB 업데이트

def update_individual():
    repo_stat = pd.DataFrame(GithubRepoStats.objects.all().values())
    
    def check_ind(contributors): # 개인리포면 1 리턴
        if contributors==1:
            return 1
        else:
            return 0
    
    def check_gr(contributors): # 그룹리포면 1 리턴
        if contributors==1:
            return 0
        else:
            return 1
    
    repo_stat['individual'] = repo_stat['contributors_count'].map(check_ind)
    repo_stat['group'] = repo_stat['contributors_count'].map(check_gr)
    repo_stat_ind = repo_stat.loc[:, ['github_id', 'repo_name','individual','group']]


    student_commits = pd.DataFrame(GithubRepoCommits.objects.all().values())

    users = pd.DataFrame(StudentTab.objects.all().values())
    usernames = users.loc[:,['github_id']]
    usernames

    def check_student(unknown_id):
        checker = int(usernames[usernames['github_id']==unknown_id].count())
        if checker > 0:
            return True
        else:
            return False


    student_commits_ind = student_commits.loc[:, ['additions', 'deletions', 'author_github' ,'committer_github', 'repo_name']]

    student_commits_ind = student_commits_ind[student_commits_ind['additions'] < commit_lines_limit] # 한 커밋에 1000개 이상 추가 한 커밋 삭제
    student_commits_ind = student_commits_ind[student_commits_ind['deletions'] < commit_lines_limit] # 한 커밋에 1000개 이상 삭제 한 커밋 삭제

    student_commits_ind['is_student'] = 0
    student_commits_ind['is_student'] = student_commits_ind['committer_github'].map(check_student) | student_commits_ind['author_github'].map(check_student)
    student_commits_ind['committer_is_student'] = student_commits_ind['committer_github'].map(check_student)
    student_commits_ind['author_is_student'] = student_commits_ind['author_github'].map(check_student)
    student_commits_ind = student_commits_ind[student_commits_ind['is_student']==True]
    student_commits_ind['student_github'] = ''

    for row_index in student_commits_ind.index:
        if student_commits_ind.loc[row_index, 'committer_is_student']:
            student_commits_ind.loc[row_index, 'student_github'] = student_commits_ind.loc[row_index, 'committer_github']
        elif student_commits_ind.loc[row_index, 'author_is_student']:
            student_commits_ind.loc[row_index, 'student_github'] = student_commits_ind.loc[row_index, 'author_github']
            
    student_commits_ind = student_commits_ind[student_commits_ind['repo_name'] != 'Web-programming-midterm-project']
    student_commits_ind['individual'] = student_commits_ind['repo_name'].map(lambda x : repo_stat_ind[repo_stat_ind['repo_name'] == x].iloc[0, 2])
    student_commits_ind['group'] = student_commits_ind['repo_name'].map(lambda x : repo_stat_ind[repo_stat_ind['repo_name'] == x].iloc[0, 3])


    def check(x):
        if x==True:
            return 'individual'
        else:
            return 'group'

    count_df = student_commits_ind.loc[:, ['student_github', 'individual', 'group']].copy()
    count_df.dropna(inplace=True)
    result_df = count_df.groupby('student_github').sum()
    result_df['group/individual'] = result_df['group']/(result_df['individual'] + 1)
    result_df['individual/group'] = result_df['individual']/(result_df['group'] + 1)
    result_df['individual-group'] = result_df['individual'] - result_df['group']
    result_df['major_act'] = result_df['individual'] >= result_df['group']
    result_df['major_act'] = result_df['major_act'].map(check)

    result_df.loc[:, ['major_act']].to_csv(os.getcwd() + '/static/data/major_act.csv')


def update_frequency():

    df_commit = pd.DataFrame(GithubRepoCommits.objects.exclude(committer_github__isnull=True).order_by('committer_github', 'committer_date').values())
    # df_commit.dropna(inplace=True)
    df_commit = df_commit.loc[:,['committer_github', 'repo_name', 'committer_date']].copy()
    df_commit.rename(columns={'committer_github':'id', 'repo_name': 'rname', 'committer_date':'cdate'}, inplace=True)
    
    print(df_commit)
    from datetime import datetime 
    import time, math
    src='2022-07-26 00:00:00'
    now_timestamp = time.mktime(datetime.strptime(src, '%Y-%m-%d %H:%M:%S').timetuple())
    print(now_timestamp)

    before_id=""
    id_repo = {}
    for i in range(len(df_commit.index)):
        row = df_commit.iloc[i]
        if row.id not in id_repo:
            id_repo[row.id] = {}
        if row.rname not in id_repo[row.id]:
            id_repo[row.id][row.rname] = []
        id_repo[row.id][row.rname].append(row.cdate)
    print(len(id_repo.keys()))
    # 현재 날짜와도 비교하는 버전
    from datetime import datetime 
    date_time_obj = ""
    id_repo_dist = {}
    repo_result = []
    id_result = []
    for id in id_repo.keys():
        id_repo_dist[id] = {}
        commit_sum = 0
        id_commit_dist = [0, 0, 0, 0]
        id_wavg = 0
        id_sigma = 0
        for repo in id_repo[id].keys():
            
            init_commit_timestamp = 0
            (criteria_1, criteria_2, criteria_3) = (0, 0, 0)
            commit_dist = [0, 0, 0, 0]
            
            commit_num = len(id_repo[id][repo])
            commit_sum += commit_num
            if commit_num > 1:
                for i in range(commit_num):
                    if i == 0 :
                        init_commit_timestamp = datetime.timestamp(datetime.strptime(str(id_repo[id][repo][i]), '%Y-%m-%d %H:%M:%S'))
                        last_commit_timestamp = datetime.timestamp(datetime.strptime(str(id_repo[id][repo][-1]), '%Y-%m-%d %H:%M:%S'))
                        criteria_1 = (last_commit_timestamp - init_commit_timestamp) / 4
                        criteria_2 = (last_commit_timestamp - init_commit_timestamp) * 2 / 4
                        criteria_3 = (last_commit_timestamp - init_commit_timestamp) * 3 / 4
                    elif i == (commit_num - 1):
                        pass
                    else :
                        target_commit_timestamp = datetime.timestamp(datetime.strptime(str(id_repo[id][repo][i]), '%Y-%m-%d %H:%M:%S')) - init_commit_timestamp
                        if target_commit_timestamp < criteria_1:
                            commit_dist[0] += 1
                            id_commit_dist[0] += 1
                        elif target_commit_timestamp < criteria_2:
                            commit_dist[1] += 1
                            id_commit_dist[1] += 1
                        elif target_commit_timestamp < criteria_3:
                            commit_dist[2] += 1
                            id_commit_dist[2] += 1
                        else :
                            commit_dist[3] += 1
                            id_commit_dist[3] += 1
                if sum(commit_dist) != 0 :
                    wavg = sum( [commit_dist[i] * i for i in range(4)] ) / sum(commit_dist)
                    mean = sum( [commit_dist[i] for i in range(4)])/4
                    sigma = math.sqrt(sum([ ((commit_dist[i] - mean)**2) for i in range(4)]) / sum(commit_dist))
                    
                    id_wavg += wavg
                    id_sigma += sigma
                    
                    id_repo_dist[id][repo] = {"id":id, "repo": repo, "dist":commit_dist, "mean": wavg, "sigma":sigma}
                    repo_result.append({"id":id, "repo": repo, "dist":commit_dist, "mean": wavg, "sigma":sigma})
                    
                    if id in ["SeoJeongYeop", "tsfo1489"]:
                        print("repo dist", id_repo_dist[id][repo])
        if len(id_repo_dist[id].keys()) > 0 and sum(id_commit_dist)>0:
            id_wavg = id_wavg/len(id_repo_dist[id].keys())
            id_sigma = id_sigma/len(id_repo_dist[id].keys())
            id_commit_wavg = sum( [id_commit_dist[i] * i for i in range(4)] ) / sum(id_commit_dist)
            id_commit_mean = sum( [id_commit_dist[i] for i in range(4)])/4
            id_commit_sigma = math.sqrt(sum([ ((id_commit_dist[i] - id_commit_mean)**2) for i in range(4)]) / sum(id_commit_dist))
            type_tag1 = 0 if id_commit_mean <= 1.5 else 1
            type_tag2 = 0 if id_commit_sigma <= 1.5 else 1
            
            id_result.append({"id":id, "dist":id_commit_dist, 
                    "mean": id_wavg, "sigma":id_sigma, 
                    "id_mean": id_commit_wavg, "id_sigma": id_commit_sigma,
                    "type1":type_tag1, "type2":type_tag2})
            
            if id in ["SeoJeongYeop", "tsfo1489"]:
                    print("id dist", {"id":id, "dist":id_commit_dist, 
                    "mean": id_wavg, "sigma":id_sigma, 
                    "id_mean": id_commit_wavg, "id_sigma": id_commit_sigma,
                    "type1":type_tag1, "type2":type_tag2})
    
    print(len(repo_result))
        
        
    df_id_result = pd.DataFrame.from_dict(id_result)

    x = np.arange(2)
    types = ['steady', 'cram']
    values =[len(df_id_result[df_id_result['type2'] == 0]), # steady는 type2가 0
            len(df_id_result[df_id_result['type2'] == 1])] # cram은 type2가 1

    df_id_result.loc[:,['id', 'type2']].to_csv(os.getcwd() + '/static/data/commit_intv.csv')

    print(df_id_result)
    print(values)
