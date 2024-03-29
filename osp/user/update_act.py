import json
import logging
import math
import os
import time
from datetime import datetime

import numpy as np
import pandas as pd
from scipy.stats import circmean

from django.db.models import Case, IntegerField, When, Q
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


def _get_commit_df():
    # StudentTab Query
    st_queryset = StudentTab.objects.values('github_id')
    st_set = set(st_query["github_id"] for st_query in st_queryset)
    # GithubRepoCommits Query
    github_repo_commits = GithubRepoCommits.objects.filter(
        additions__lt=commit_lines_limit, deletions__lt=commit_lines_limit)
    # author나 committer가 학생인 경우 쿼리
    target_commits = github_repo_commits.filter(
        Q(author_github__in=st_set) | Q(committer_github__in=st_set)
    ).values('github_id', 'repo_name', 'committer_date', 'author_github',
             'committer_github')
    # Make Commit DataFrame
    commit_df = pd.DataFrame(target_commits)
    commit_df['contr_id'] = commit_df.apply(
        lambda row: row['author_github'] if pd.notnull(row['author_github']) else row['committer_github'], axis=1
    )
    commit_df.drop('author_github', axis=1, inplace=True)
    commit_df.drop('committer_github', axis=1, inplace=True)

    return commit_df


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

    # Make Commit DataFrame
    commit_df = _get_commit_df()

    commit_df['committer_time'] = commit_df['committer_date'].map(
        time_to_seconds)
    st_commits_time = commit_df.loc[:, [
        'contr_id', 'committer_time']].sort_values(by='contr_id')
    st_commits_hour = {}
    total_hour_dist = [0] * 24
    daytime_min = 9
    daytime_max = 18
    for i in range(len(st_commits_time.index)):
        row = st_commits_time.iloc[i]
        github_id = row.contr_id
        if github_id not in st_commits_hour:
            st_commits_hour[github_id] = {
                "contr_id": github_id, "hour_dist": [0]*24, "daytime": 0, "night": 0}
        commit_hour = int(row.committer_time/3600)
        st_commits_hour[github_id]["hour_dist"][commit_hour] += 1
        if daytime_min <= commit_hour < daytime_max:
            st_commits_hour[github_id]["daytime"] += 1
        else:
            st_commits_hour[github_id]["night"] += 1
        total_hour_dist[commit_hour] += 1

    st_commits_hour = pd.DataFrame.from_dict(st_commits_hour, orient='index')
    st_commits_hour.to_csv(DATA_DIR + commmit_time_path1, index=False)

    circmean_src = []
    for i in range(len(total_hour_dist)):
        circmean_src += [i * 3600]*total_hour_dist[i]
    circmean_total = circmean(circmean_src, high=86399,
                              low=0, axis=None, nan_policy='propagate')
    max_total_index = np.argmax(total_hour_dist)

    commit_time_df = commit_df.groupby(['contr_id']).apply(cal_circmean)
    commit_time_df = pd.DataFrame(commit_time_df)
    commit_time_df.columns = ['time_circmean']
    commit_time_df['time_circmean'] = commit_time_df['time_circmean'].map(int)
    commit_time_df['hour_circmean'] = commit_time_df['time_circmean'].map(
        lambda x: int(x/3600))

    commit_time_df.reset_index().to_csv(DATA_DIR + commmit_time_path2, index=False)

    # Calculate time_sector
    sectors = [i*3600 for i in range(24)]
    commit_times = [0]*24
    for time_t in commit_time_df['time_circmean']:
        hour = int(time_t/3600)
        commit_times[hour] += 1
    entire_user_count = len(commit_time_df)
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
    commit_df = _get_commit_df()

    # GithubRepoStats Query
    repo_stat_queryset = GithubRepoStats.objects.values('github_id', 'repo_name').annotate(
        individual=Case(When(contributors_count=1, then=1),
                        default=0, output_field=IntegerField()),
        group=Case(When(contributors_count__gt=1, then=1), default=0, output_field=IntegerField()))
    # Make Dataframe
    repo_stat_ind = pd.DataFrame(repo_stat_queryset)

    # Merge Dataframe Repo stats and Commit
    student_merge = pd.merge(left=commit_df, right=repo_stat_ind, how="left", on=[
                             "github_id", "repo_name"])

    # Calculate Result
    def check(x):
        if x == True:
            return 'individual'
        else:
            return 'group'

    count_df = student_merge.loc[:, [
        'contr_id', 'individual', 'group']].copy()
    count_df.dropna(inplace=True)
    result_df = count_df.groupby('contr_id').sum()
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

    commit_df = _get_commit_df()
    commit_df = commit_df.loc[:, [
        'contr_id', 'repo_name', 'committer_date']].copy()
    commit_df.rename(columns={'contr_id': 'id',
                     'repo_name': 'rname', 'committer_date': 'cdate'}, inplace=True)
    commit_df.sort_values(by=['cdate'], inplace=True, ignore_index=True)

    # Analysis
    id_repo = {}
    for i in range(len(commit_df.index)):
        row = commit_df.iloc[i]
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
    daytime, night, hour_dist, time_circmean = 0, 0, [0]*24, 0
    try:
        committer_hour_dist = pd.read_csv(filepath1, index_col=0)
        if username in committer_hour_dist.index:
            hour_dist = committer_hour_dist.at[username, "hour_dist"]
            hour_dist = json.loads(hour_dist)
            daytime = committer_hour_dist.at[username, "daytime"]
            night = committer_hour_dist.at[username, "night"]
    except Exception as e:
        logging.exception(f"Read Hour_dist exception: {e}")
    try:
        time_circmean_df = pd.read_csv(filepath2, index_col=0)
        if username in time_circmean_df.index:
            time_circmean = time_circmean_df.at[username, "time_circmean"]
    except Exception as e:
        logging.exception(f"Read Circmean exception", e)

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
    indi_num, group_num, major_act = 0, 0, "individual"
    try:
        major_act_df = pd.read_csv(filepath, index_col=0)
        if username in major_act_df.index:
            major_act = major_act_df.at[username, "major_act"]
            indi_num = int(major_act_df.at[username, "individual"])
            group_num = int(major_act_df.at[username, "group"])
    except Exception as e:
        logging.exception(f"Read Major_act exception: {e}")
    return major_act, indi_num, group_num


def read_frequency(username):
    filepath = DATA_DIR + frequency_path1
    if not os.path.exists(filepath):
        update_frequency()
    commit_freq, commit_freq_dist = 0, [0]*4
    try:
        committer_frequency = pd.read_csv(filepath, index_col=0)
        if username in committer_frequency.index:
            commit_freq = committer_frequency.at[username, "type3"]
            commit_freq_dist = committer_frequency.at[username, "dist"]
            commit_freq_dist = json.loads(commit_freq_dist)
    except Exception as e:
        logging.exception(f"Read Freq exception {e}")

    return commit_freq, commit_freq_dist
