import json
import logging
import math
import os
import time
from datetime import datetime

import numpy as np
import pandas as pd
from scipy.stats import circmean

from django.db.models import Case, IntegerField, When
from repository.models import GithubRepoCommits, GithubRepoStats
from user.models import StudentTab
from osp.settings import BASE_DIR

commit_lines_limit = 1000
update_act_dir = "static/data/"
DATA_DIR = os.path.join(BASE_DIR, update_act_dir)
commmit_time_path1 = "committer_hour_dist.csv"
commmit_time_path2 = "committer_time_circmean.csv"
commmit_time_path3 = "time_sector.csv"
major_act_path1 = "major_act.csv"
frequency_path1 = "commit_intv.csv"


def update_commmit_time():

    start = time.time()

    def time_to_seconds(hour_min_sec):
        # UTC + 9 => KST
        time_t = datetime.strptime(
            str(hour_min_sec), '%Y-%m-%d %H:%M:%S').strftime('%H:%M:%S')
        hhmmss = time_t.split(':')
        hour = (int(hhmmss[0]) + 9) % 24
        minute = int(hhmmss[1])
        sec = int(hhmmss[2])
        return hour*3600 + minute*60 + sec

    def cal_circmean(df):
        circular_mean = circmean(
            df['committer_time'], high=86399, low=0, axis=None, nan_policy='propagate')
        return (circular_mean)

    # StudentTab Query
    st_queryset = StudentTab.objects.values('github_id')
    st_set = set(st_query["github_id"] for st_query in st_queryset)
    # GithubRepoCommits Query
    github_repo_commits = GithubRepoCommits.objects.filter(
        additions__lt=commit_lines_limit, deletions__lt=commit_lines_limit)

    target_committer = github_repo_commits.filter(committer_github__in=st_set).exclude(
        author_github__in=st_set) | github_repo_commits.filter(committer_github__in=st_set, author_github__isnull=True)
    target_author = github_repo_commits.filter(author_github__in=st_set).exclude(
        committer_github__in=st_set) | github_repo_commits.filter(author_github__in=st_set, committer_github__isnull=True)
    target_bi = github_repo_commits.filter(
        author_github__in=st_set, committer_github__in=st_set)

    # Make Commit DataFrame and concat
    sc_1 = pd.DataFrame(target_committer.values())
    sc_1['student_github'] = sc_1["committer_github"]
    sc_2 = pd.DataFrame(target_author.values())
    sc_2['student_github'] = sc_2["author_github"]
    sc_3 = pd.DataFrame(target_bi.values())
    sc_3['student_github'] = sc_3["author_github"]
    student_commits_time = pd.concat([sc_1, sc_2, sc_3], ignore_index=True)
    student_commits_time['committer_time'] = student_commits_time['committer_date'].map(
        time_to_seconds)
    stdnt_cmt_time = student_commits_time.loc[:, [
        'student_github',  'committer_time']].sort_values(by='student_github')
    stdnt_cmt_hour = {}
    total_hour_dist = [0] * 24
    daytime_min = 9
    daytime_max = 18
    for i in range(len(stdnt_cmt_time.index)):
        row = stdnt_cmt_time.iloc[i]
        if row.student_github not in stdnt_cmt_hour:
            stdnt_cmt_hour[row.student_github] = {
                "student_github": row.student_github, "hour_dist": [0]*24, "daytime": 0, "night": 0}
        cmt_hour = int(row.committer_time/3600)
        stdnt_cmt_hour[row.student_github]["hour_dist"][cmt_hour] += 1
        if daytime_min <= cmt_hour and cmt_hour < daytime_max:
            stdnt_cmt_hour[row.student_github]["daytime"] += 1
        else:
            stdnt_cmt_hour[row.student_github]["night"] += 1
        total_hour_dist[cmt_hour] += 1

    stdnt_cmt_hour = pd.DataFrame.from_dict(stdnt_cmt_hour, orient='index')
    stdnt_cmt_hour.to_csv(DATA_DIR + commmit_time_path1, index=False)

    circmean_src = []
    for i in range(len(total_hour_dist)):
        circmean_src += [i * 3600]*total_hour_dist[i]
    circmean_total = circmean(circmean_src, high=86399,
                              low=0, axis=None, nan_policy='propagate')
    max_total_index = np.argmax(total_hour_dist)

    student_commits_time = student_commits_time.groupby(
        ['student_github']).apply(cal_circmean)
    student_commits_time = pd.DataFrame(student_commits_time)
    student_commits_time.columns = ['committer_time_circmean']
    student_commits_time['committer_time_circmean'] = student_commits_time['committer_time_circmean'].map(
        int)
    student_commits_time['committer_hour_circmean'] = student_commits_time['committer_time_circmean'].map(
        lambda x: int(x/3600))

    student_commits_time.reset_index().to_csv(
        DATA_DIR + commmit_time_path2, index=False)

    # Calculate time_sector
    sectors = [i*3600 for i in range(24)]
    commit_times = [0]*24
    for time_t in student_commits_time['committer_time_circmean']:
        hour = int(time_t/3600)
        commit_times[hour] += 1
    entire_user_count = len(student_commits_time)
    max_index = np.argmax(commit_times)
    current_user_count = commit_times[max_index]
    radius = 0
    while (current_user_count/entire_user_count < 0.7):
        radius += 1
        current_user_count += commit_times[max_index - radius]
        current_user_count += commit_times[max_index + radius]

    time_sector = pd.DataFrame({'sector': ['major_min', 'major_max', 'daytime_min', 'daytime_max', 'total_circmean', 'freq_hour'], 'second': [
                               sectors[max_index-radius], sectors[max_index+radius+1], daytime_min*3600, daytime_max*3600, int(circmean_total), max_total_index]})
    time_sector.to_csv(DATA_DIR + commmit_time_path3, index=False)

    print("update_commmit_time() total time", time.time() - start)


def update_individual():

    start = time.time()
    # GithubRepoStats Query
    repo_stat_queryset = GithubRepoStats.objects.values('github_id', 'repo_name').annotate(
        individual=Case(When(contributors_count=1, then=1),
                        default=0, output_field=IntegerField()),
        group=Case(When(contributors_count__gt=1, then=1), default=0, output_field=IntegerField()))
    # Make Dataframe
    repo_stat_ind = pd.DataFrame(repo_stat_queryset)

    # StudentTab Query
    st_queryset = StudentTab.objects.values('github_id')
    st_set = set(st_query["github_id"] for st_query in st_queryset)
    # GithubRepoCommits Query
    github_repo_commits = GithubRepoCommits.objects.filter(
        additions__lt=commit_lines_limit, deletions__lt=commit_lines_limit)

    target_committer = github_repo_commits.filter(committer_github__in=st_set).exclude(
        author_github__in=st_set) | github_repo_commits.filter(committer_github__in=st_set, author_github__isnull=True)
    target_author = github_repo_commits.filter(author_github__in=st_set).exclude(
        committer_github__in=st_set) | github_repo_commits.filter(author_github__in=st_set, committer_github__isnull=True)
    target_bi = github_repo_commits.filter(
        author_github__in=st_set, committer_github__in=st_set)

    # Make Commit DataFrame and concat
    sc_1 = pd.DataFrame(target_committer.values())
    sc_1['student_github'] = sc_1["committer_github"]
    sc_2 = pd.DataFrame(target_author.values())
    sc_2['student_github'] = sc_2["author_github"]
    sc_3 = pd.DataFrame(target_bi.values())
    sc_3['student_github'] = sc_3["author_github"]
    student_commits_ind = pd.concat([sc_1, sc_2, sc_3], ignore_index=True)

    # Merge Dataframe Repo stats and Commit
    student_merge = pd.merge(left=student_commits_ind, right=repo_stat_ind, how="left", on=[
                             "github_id", "repo_name"])

    # Calculate Result
    def check(x):
        if x == True:
            return 'individual'
        else:
            return 'group'

    count_df = student_merge.loc[:, [
        'student_github', 'individual', 'group']].copy()
    count_df.dropna(inplace=True)
    result_df = count_df.groupby('student_github').sum()
    result_df['group/individual'] = result_df['group'] / \
        (result_df['individual'] + 1)
    result_df['individual/group'] = result_df['individual'] / \
        (result_df['group'] + 1)
    result_df['individual-group'] = result_df['individual'] - \
        result_df['group']
    result_df['major_act'] = result_df['individual'] >= result_df['group']
    result_df['major_act'] = result_df['major_act'].map(check)
    result_df.individual = result_df.individual.astype(int)
    result_df.group = result_df.group.astype(int)
    result_df.loc[:, ['individual', 'group', 'major_act']].to_csv(
        DATA_DIR + major_act_path1)

    print("result_df:", len(result_df))
    print("update_individual() total time", time.time() - start)


def update_frequency():

    start = time.time()
    # StudentTab Query
    st_queryset = StudentTab.objects.values('github_id')
    st_set = set(st_query["github_id"] for st_query in st_queryset)
    # GithubRepoCommits Query
    github_repo_commits = GithubRepoCommits.objects.filter(
        additions__lt=commit_lines_limit, deletions__lt=commit_lines_limit)
    target_committer = github_repo_commits.filter(committer_github__in=st_set).exclude(
        author_github__in=st_set) | github_repo_commits.filter(committer_github__in=st_set, author_github__isnull=True)
    target_author = github_repo_commits.filter(author_github__in=st_set).exclude(
        committer_github__in=st_set) | github_repo_commits.filter(author_github__in=st_set, committer_github__isnull=True)
    target_bi = github_repo_commits.filter(
        author_github__in=st_set, committer_github__in=st_set)

    # Make DataFrame
    sc_1 = pd.DataFrame(target_committer.values())
    sc_1['student_github'] = sc_1["committer_github"]
    sc_2 = pd.DataFrame(target_author.values())
    sc_2['student_github'] = sc_2["author_github"]
    sc_3 = pd.DataFrame(target_bi.values())
    sc_3['student_github'] = sc_3["author_github"]
    student_commits = pd.concat([sc_1, sc_2, sc_3], ignore_index=True)

    df_commit = student_commits.loc[:, [
        'student_github', 'repo_name', 'committer_date']].copy()
    df_commit.rename(columns={'student_github': 'id',
                     'repo_name': 'rname', 'committer_date': 'cdate'}, inplace=True)
    df_commit.sort_values(by=['cdate'], inplace=True, ignore_index=True)

    # Analysis
    id_repo = {}
    for i in range(len(df_commit.index)):
        row = df_commit.iloc[i]
        if row.id not in id_repo:
            id_repo[row.id] = {}
        if row.rname not in id_repo[row.id]:
            id_repo[row.id][row.rname] = []
        id_repo[row.id][row.rname].append(row.cdate)

    id_repo_dist = {}
    repo_result = []
    id_result = []
    for id in id_repo.keys():

        id_repo_dist[id] = {}
        commit_sum, id_wavg, id_sigma = 0, 0, 0
        id_commit_dist = [0, 0, 0, 0]
        for repo in id_repo[id].keys():

            init_ctime = 0
            (criteria_1, criteria_2, criteria_3) = (0, 0, 0)
            commit_dist = [0, 0, 0, 0]
            commit_num = len(id_repo[id][repo])
            commit_sum += commit_num
            if commit_num > 1:
                for i in range(commit_num):
                    if i == 0:
                        init_ctime = datetime.timestamp(datetime.strptime(
                            str(id_repo[id][repo][i]), '%Y-%m-%d %H:%M:%S'))
                        last_ctime = datetime.timestamp(datetime.strptime(
                            str(id_repo[id][repo][-1]), '%Y-%m-%d %H:%M:%S'))
                        criteria_1 = (last_ctime - init_ctime) / 4
                        criteria_2 = criteria_1 * 2
                        criteria_3 = criteria_1 * 3
                    elif i == (commit_num - 1):
                        pass
                    else:
                        target_ctime = datetime.timestamp(datetime.strptime(
                            str(id_repo[id][repo][i]), '%Y-%m-%d %H:%M:%S')) - init_ctime
                        if target_ctime < criteria_1:
                            commit_dist[0] += 1
                            id_commit_dist[0] += 1
                        elif target_ctime < criteria_2:
                            commit_dist[1] += 1
                            id_commit_dist[1] += 1
                        elif target_ctime < criteria_3:
                            commit_dist[2] += 1
                            id_commit_dist[2] += 1
                        else:
                            commit_dist[3] += 1
                            id_commit_dist[3] += 1
                if sum(commit_dist) != 0:
                    wavg = sum([commit_dist[i] * i for i in range(4)]
                               ) / sum(commit_dist)
                    mean = sum([commit_dist[i] for i in range(4)])/4
                    sigma = math.sqrt(
                        sum([((commit_dist[i] - mean)**2) for i in range(4)]) / sum(commit_dist))

                    id_wavg += wavg
                    id_sigma += sigma

                    id_repo_dist[id][repo] = {
                        "id": id, "repo": repo, "dist": commit_dist, "mean": wavg, "sigma": sigma}
                    repo_result.append(
                        {"id": id, "repo": repo, "dist": commit_dist, "mean": wavg, "sigma": sigma})

        if len(id_repo_dist[id].keys()) > 0 and sum(id_commit_dist) > 0:
            id_wavg = id_wavg/len(id_repo_dist[id].keys())
            id_sigma = id_sigma/len(id_repo_dist[id].keys())
            weight = [-2, -1, 1, 2]
            id_commit_wavg = sum([id_commit_dist[i] * weight[i]
                                 for i in range(4)]) / sum(id_commit_dist)
            id_commit_mean = sum([id_commit_dist[i] for i in range(4)])/4
            id_commit_sigma = math.sqrt(sum(
                [((id_commit_dist[i] - id_commit_mean)**2) for i in range(4)]) / sum(id_commit_dist))
            type_tag1 = 0 if id_commit_mean <= 1.5 else 1
            type_tag2 = 0 if id_commit_sigma <= 1.5 else 1
            type_tag3 = round(id_commit_wavg, 2)

            id_result.append({"id": id, "dist": id_commit_dist,
                              "mean": id_wavg, "sigma": id_sigma,
                              "id_mean": id_commit_wavg, "id_sigma": id_commit_sigma,
                              "type1": type_tag1, "type2": type_tag2, "type3": type_tag3})

    df_id_result = pd.DataFrame.from_dict(id_result)
    df_id_result.loc[:, ['id', 'type3', "dist"]].to_csv(
        DATA_DIR + frequency_path1, index=False)

    print("id:", len(id_repo.keys()), "repo:", len(repo_result))
    print("update_frequency() total time", time.time() - start)


def read_commit_time(username):

    if not os.path.isdir(DATA_DIR):
        try:
            os.makedirs(DATA_DIR)
        except OSError as e:
            logging.error(f"Error in making a directory {DATA_DIR}: {e}")
    filepath1 = DATA_DIR + commmit_time_path1
    filepath2 = DATA_DIR + commmit_time_path2
    filepath3 = DATA_DIR + commmit_time_path3
    if not (os.path.exists(filepath1)
            and os.path.exists(filepath2)
            and os.path.exists(filepath3)):
        update_commmit_time()
    try:
        committer_hour_dist = pd.read_csv(filepath1, index_col=0)
        hour_dist = committer_hour_dist.at[username, "hour_dist"]
        hour_dist = json.loads(hour_dist)
        daytime = committer_hour_dist.at[username, "daytime"]
        night = committer_hour_dist.at[username, "night"]
    except Exception as e:
        logging.exception(f"Read Hour_dist exception: {e}")
        daytime, night, hour_dist = 0, 0, [0]*24
    try:
        committer_time_circmean = pd.read_csv(filepath2, index_col=0)
        time_circmean = committer_time_circmean.at[username,
                                                   "committer_time_circmean"]
    except Exception as e:
        logging.exception(f"Read Circmean exception", e)
        time_circmean = 0

    # TODO 데이터에 대한 추가적인 논의 필요
    try:
        committer_time_guide = pd.read_csv(filepath3, index_col=0)
        daytime_min = committer_time_guide.at["daytime_min", "second"]
        daytime_max = committer_time_guide.at["daytime_max", "second"]
    except Exception as e:
        logging.exception(f"Read Time_sector exception {e}")
        daytime_min, daytime_max = 32400, 75600

    return hour_dist, int(time_circmean), int(daytime), int(night), int(daytime_min), int(daytime_max)


def read_major_act(username):

    filepath = DATA_DIR + major_act_path1
    if not os.path.exists(filepath):
        update_individual()
    try:
        major_act_df = pd.read_csv(filepath, index_col=0)
        major_act = major_act_df.at[username, "major_act"]
        indi_num = int(major_act_df.at[username, "individual"])
        group_num = int(major_act_df.at[username, "group"])
    except Exception as e:
        logging.exception(f"Read Major_act exception: {e}")
        indi_num, group_num, major_act = 0, 0, "individual"
    return major_act, indi_num, group_num


def read_frequency(username):
    filepath = DATA_DIR + frequency_path1
    if not os.path.exists(filepath):
        update_frequency()
    try:
        committer_frequency = pd.read_csv(filepath, index_col=0)
        commit_freq = committer_frequency.at[username, "type3"]
        commit_freq_dist = committer_frequency.at[username, "dist"]
        commit_freq_dist = json.loads(commit_freq_dist)
    except Exception as e:
        logging.exception(f"Read Freq exception {e}")
        commit_freq, commit_freq_dist = 0, [0]*4

    return commit_freq, commit_freq_dist
