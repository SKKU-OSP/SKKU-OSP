import os
import pandas as pd

from osp.settings import STATICFILES_DIRS
from user.models import Account, GithubUserFollowing, GithubUserStarred
from repository.models import GithubRepoContributor
from .models import Team, TeamMember

from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity

def cossim_matrix(a, b):
    cossim_values = cosine_similarity(a.values, b.values)
    cossim_df = pd.DataFrame(data=cossim_values, columns = a.index.values, index=a.index)

    return cossim_df

def build_dataset():
    account_list = Account.objects.all().values('user', 'student_data__github_id')
    dataset = pd.DataFrame(account_list).rename(columns={'student_data__github_id': 'github_id'})
    
    starred = GithubUserStarred.objects.all().values()
    starred_df = pd.DataFrame(starred)
    starred_df['starred'] = ['Starred-' + x[1] + '/' + x[2] for _, x in starred_df.iterrows()]
    starred_df['score'] = 1
    starred_df = starred_df.pivot_table('score', index='github_id', columns='starred').fillna(0).reset_index()
    dataset = pd.merge(dataset, starred_df, how='left', on='github_id')
    
    contribute = GithubRepoContributor.objects.all().values()
    contribute_df = pd.DataFrame(contribute)
    contribute_df['contribute'] = ['Contributed-' + x[1] + '/' + x[2] for _, x in contribute_df.iterrows()]
    contribute_df['score'] = 1
    contribute_df = contribute_df.pivot_table('score', index='github_id', columns='contribute').fillna(0).reset_index()
    dataset = pd.merge(dataset, contribute_df, how='left', on='github_id')
    
    following = GithubUserFollowing.objects.all().values()
    following_df = pd.DataFrame(following)
    following_df['score'] = 1
    following_df = following_df.pivot_table('score', index='github_id', columns='following_id').fillna(0).reset_index()
    dataset = pd.merge(dataset, following_df, how='left', on='github_id').fillna(0).drop('github_id', axis=1)
    
    dataset.to_csv(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv'))
    return dataset

def get_team_vector(team_df: pd.DataFrame):
    team_vector = pd.Series(index=team_df.columns, dtype='int64').fillna(0).astype('int64')
    for _, member in team_df.iterrows():
        team_vector = team_vector | member
    team_vector['user'] = '!Team!'
    return team_vector.to_frame().transpose()

def get_team_recommendation(team: Team):
    if not os.path.exists(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv')):
        dataset = build_dataset()
    else:
        dataset_mod_time = os.path.getmtime(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv'))
        if datetime.now() - datetime.fromtimestamp(dataset_mod_time) > timedelta(days=0.25):
            dataset = build_dataset()
        else:
            dataset = pd.read_csv(os.path.join(STATICFILES_DIRS[0], f'data/recommend_dataset.csv'), index_col=0)
    member_list = TeamMember.objects.filter(team=team).values_list('member', flat=True)
    team_df = dataset[dataset['user'].isin(member_list)].copy().drop(['user'], axis=1).astype('int64')
    team_vector = get_team_vector(team_df)
    target_dataset = pd.concat([dataset, team_vector], axis=0, ignore_index=True).set_index('user')
    cossim = cossim_matrix(target_dataset, target_dataset)
    sim = cossim['!Team!'][(cossim['!Team!'] > 0.0)].sort_values(ascending=False)
    # print(sim)
    # print( list(member_list))
    sim = sim.drop(labels='!Team!', axis=0)
    return list(set(sim.index) - set(member_list))
