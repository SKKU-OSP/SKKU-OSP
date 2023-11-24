import os
import time
from datetime import datetime, timedelta

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from osp.settings import STATICFILES_DIRS
from repository.models import GithubRepoContributor
from team.models import Team, TeamMember
from user.models import Account, GithubUserFollowing, GithubUserStarred


def cossim_matrix(a, b):
    cossim_values = cosine_similarity(a.values, b.values)
    cossim_df = pd.DataFrame(
        data=cossim_values, columns=a.index.values, index=a.index)

    return cossim_df


def build_dataset():
    account_list = Account.objects.all().values('user', 'student_data__github_id')
    dataset = pd.DataFrame(account_list).rename(
        columns={'student_data__github_id': 'github_id'})

    starred = GithubUserStarred.objects.all().values()
    starred_df = pd.DataFrame(starred)
    starred_df['starred'] = ['Starred-' + x[1] + '/' + x[2]
                             for _, x in starred_df.iterrows()]
    starred_df['score'] = 1
    starred_df = starred_df.pivot_table(
        'score', index='github_id', columns='starred').fillna(0).reset_index()
    dataset = pd.merge(dataset, starred_df, how='left', on='github_id')

    contribute = GithubRepoContributor.objects.all().values()
    contribute_df = pd.DataFrame(contribute)
    contribute_df['contribute'] = ['Contributed-' + x[1] + '/' + x[2]
                                   for _, x in contribute_df.iterrows()]
    contribute_df['score'] = 1
    contribute_df = contribute_df.pivot_table(
        'score', index='github_id', columns='contribute').fillna(0).reset_index()
    dataset = pd.merge(dataset, contribute_df, how='left', on='github_id')

    following = GithubUserFollowing.objects.all().values()
    following_df = pd.DataFrame(following)
    following_df['score'] = 1
    following_df = following_df.pivot_table(
        'score', index='github_id', columns='following_id').fillna(0).reset_index()
    dataset = pd.merge(dataset, following_df, how='left',
                       on='github_id').fillna(0).drop('github_id', axis=1)

    dataset.to_csv(os.path.join(
        STATICFILES_DIRS[0], f'data/recommend_dataset.csv'))
    return dataset


def get_team_vector(team_df: pd.DataFrame):
    team_vector = pd.Series(index=team_df.columns,
                            dtype='int64').fillna(0).astype('int64')
    for _, member in team_df.iterrows():
        team_vector = team_vector | member
    team_vector['user'] = '!Team!'
    return team_vector.to_frame().transpose()


def get_team_recommendation(team: Team):
    if not os.path.exists(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv')):
        dataset = build_dataset()
    else:
        dataset_mod_time = os.path.getmtime(os.path.join(
            STATICFILES_DIRS[0], f'data/recommend_dataset.csv'))
        if datetime.now() - datetime.fromtimestamp(dataset_mod_time) > timedelta(days=0.25):
            dataset = build_dataset()
        else:
            dataset = pd.read_csv(os.path.join(
                STATICFILES_DIRS[0], f'data/recommend_dataset.csv'), index_col=0)
    member_list = TeamMember.objects.filter(
        team=team).values_list('member', flat=True)
    team_df = dataset[dataset['user'].isin(member_list)].copy().drop([
        'user'], axis=1).astype('int64')
    team_vector = get_team_vector(team_df)
    target_dataset = pd.concat(
        [dataset, team_vector], axis=0, ignore_index=True).set_index('user')
    cossim = cossim_matrix(target_dataset, target_dataset)
    sim = cossim['!Team!'][(cossim['!Team!'] > 0.0)
                           ].sort_values(ascending=False)
    # print(sim)
    # print( list(member_list))
    sim = sim.drop(labels='!Team!', axis=0)
    return list(set(sim.index) - set(member_list))


def get_team_recommendation_list(team_list: list):
    '''
    추천 팀원 검색

    Returns:
        team_id를 key로 하고 추천 멤버 아이디 리스트를 value로 갖는 dictionary
    Caller:
        community/views.py
    '''

    start = time.time()
    if not os.path.exists(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv')):
        dataset = build_dataset()
    else:
        dataset_mod_time = os.path.getmtime(os.path.join(
            STATICFILES_DIRS[0], f'data/recommend_dataset.csv'))
        if datetime.now() - datetime.fromtimestamp(dataset_mod_time) > timedelta(days=0.25):
            dataset = build_dataset()
        else:
            dataset = pd.read_csv(os.path.join(
                STATICFILES_DIRS[0], f'data/recommend_dataset.csv'), index_col=0)

    team_dict = {}
    member_list = TeamMember.objects.filter(team__in=team_list)
    for ml in member_list:
        if ml.team_id in team_dict:
            team_dict[ml.team_id].append(ml.member_id)
        else:
            team_dict[ml.team_id] = [ml.member_id]

    recomm_dict = {}
    # cossim_matrix 실행에 대부분의 시간 소요
    for team_id in team_dict:
        member_list = team_dict[team_id]
        team_df = dataset[dataset['user'].isin(member_list)].copy().drop([
            'user'], axis=1).astype('int64')
        team_vector = get_team_vector(team_df)
        target_dataset = pd.concat(
            [dataset, team_vector], axis=0, ignore_index=True).set_index('user')
        cossim = cossim_matrix(target_dataset, target_dataset)
        sim = cossim['!Team!'][(cossim['!Team!'] > 0.0)
                               ].sort_values(ascending=False)
        # print(sim)
        # print(list(member_list))
        sim = sim.drop(labels='!Team!', axis=0)
        mem_li = list(set(sim.index) - set(member_list))
        recomm_dict[team_id] = mem_li

    print("elapsed time get_team_recommendation_list", time.time()-start)
    return recomm_dict


def get_team_recommendation(team_id):
    '''
    추천 팀원 검색

    Returns:
        team_id에 대한 추천 멤버 아이디 key로 하고 similarity를 value로 갖는 dictionary
    Caller:
        team/views.py
    '''

    start = time.time()
    if not os.path.exists(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv')):
        dataset = build_dataset()
    else:
        dataset_mod_time = os.path.getmtime(os.path.join(
            STATICFILES_DIRS[0], f'data/recommend_dataset.csv'))
        if datetime.now() - datetime.fromtimestamp(dataset_mod_time) > timedelta(days=0.25):
            dataset = build_dataset()
        else:
            dataset = pd.read_csv(os.path.join(
                STATICFILES_DIRS[0], f'data/recommend_dataset.csv'), index_col=0)

    member_list = list(TeamMember.objects.filter(
        team_id=team_id).values_list('member_id', flat=True))

    team_df = dataset[dataset['user'].isin(member_list)].copy().drop([
        'user'], axis=1).astype('int64')
    team_vector = get_team_vector(team_df)
    target_dataset = pd.concat(
        [dataset, team_vector], axis=0, ignore_index=True).set_index('user')

    # cossim_matrix 실행에 대부분의 시간 소요
    cossim = cossim_matrix(target_dataset, target_dataset)
    sim = cossim['!Team!'][(cossim['!Team!'] > 0.0)
                           ].sort_values(ascending=False)

    # 이미 팀 멤버인 경우 드랍
    sim = sim.drop(labels=['!Team!']+member_list, axis=0, errors='ignore')
    recomm_dict = sim.to_dict()

    print("elapsed time get_team_recommendation_list", time.time()-start)
    return recomm_dict
