import time

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from repository.models import GithubRepoContributor
from team.models import TeamMember
from user.models import Account, GithubUserFollowing, GithubUserStarred


def cossim_matrix(a, b):
    cossim_values = cosine_similarity(a.values, b.values)
    cossim_df = pd.DataFrame(
        data=cossim_values, columns=a.index.values, index=a.index)

    return cossim_df


def build_dataset():
    account_list = Account.objects.filter(
        user__is_superuser=False).values('user', 'github_id')
    dataset = pd.DataFrame(account_list)

    starred = GithubUserStarred.objects.values()
    starred_df = pd.DataFrame(starred)
    starred_df['starred'] = [
        f'S-{x[1]}/{x[2]}' for _, x in starred_df.iterrows()]
    starred_df['score'] = 1
    starred_df = starred_df.pivot_table(
        'score', index='github_id', columns='starred').fillna(0).reset_index()
    dataset = pd.merge(dataset, starred_df, how='left', on='github_id')

    contribute = GithubRepoContributor.objects.values()
    contribute_df = pd.DataFrame(contribute)
    contribute_df['contribute'] = [
        f'C-{x[1]}/{x[2]}' for _, x in contribute_df.iterrows()]
    contribute_df['score'] = 1
    contribute_df = contribute_df.pivot_table(
        'score', index='github_id', columns='contribute').fillna(0).reset_index()
    dataset = pd.merge(dataset, contribute_df, how='left', on='github_id')

    following = GithubUserFollowing.objects.values()
    following_df = pd.DataFrame(following)
    following_df['score'] = 1
    following_df = following_df.pivot_table(
        'score', index='github_id', columns='following_id').fillna(0).reset_index()
    dataset = pd.merge(dataset, following_df, how='left',
                       on='github_id').fillna(0).drop('github_id', axis=1)

    return dataset


def get_team_vector(team_df: pd.DataFrame):
    team_vector = pd.Series(0, index=team_df.columns)
    team_vector = team_vector | team_df.any(axis=0)
    team_vector['user'] = '!Team!'
    return pd.DataFrame([team_vector])


def get_team_recommendation(team_id):
    '''
    추천 팀원 검색

    Returns:
        team_id에 대한 추천 멤버 아이디 key로 하고 similarity를 value로 갖는 dictionary
    Caller:
        team/views.py
    '''

    start = time.time()
    dataset = build_dataset()

    member_list = list(TeamMember.objects.filter(
        team_id=team_id).values_list('member_id', flat=True))

    team_df = dataset[dataset['user'].isin(member_list)]
    team_vector = get_team_vector(team_df)
    target_dataset = pd.concat(
        [dataset, team_vector], axis=0, ignore_index=True).set_index('user')

    cossim = cossim_matrix(target_dataset, target_dataset)
    sim = cossim['!Team!'][(cossim['!Team!'] > 0.0)
                           ].sort_values(ascending=False)

    # 이미 팀 멤버인 경우 드랍
    sim = sim.drop(labels=['!Team!']+member_list, axis=0, errors='ignore')
    recomm_dict = sim.to_dict()

    print("elapsed time get_team_recommendation", time.time() - start)
    return recomm_dict
