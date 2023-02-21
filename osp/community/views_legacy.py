from django.shortcuts import render, redirect

from .models import *
from team.models import TeamMember, TeamTag, TeamInviteMessage
from user.models import Account, AccountPrivacy
from community.models import TeamRecruitArticle

import math
from datetime import datetime

def board(request, board_name, board_id):
    try:
        board = Board.objects.get(id=board_id)
    except Board.DoesNotExist:
        return redirect('/community')
    context = {'board': board}

    if request.user.is_authenticated:
        account = Account.objects.get(user_id=request.user.id)
        
        try:
            acc_pp = AccountPrivacy.objects.get(account=account)
        except:
            acc_pp = AccountPrivacy.objects.create(account=account, open_lvl=0, is_write=False, is_open=False)
        context['is_write'] = acc_pp.is_write
        context['is_open'] = acc_pp.is_open
    else:
        account = None
        context['is_write'] = 0
        context['is_open'] = 0

    if board.team_id is not None:
        if not request.user.is_authenticated:
            return redirect('/community')

        # 팀 소속일 경우 팀 게시판 로드
        # 팀에 초대받은 상태일 경우 메시지와 invited_user True 전달해 표시
        # 그외의 경우 커뮤니티 메인페이지로 리다이렉트
        context['waitedInviteMsg'] = TeamInviteMessage.objects.filter(team__id=board.team_id, account__user=request.user, direction=True, status=0)
        if TeamMember.objects.filter(team=board.team_id, member_id=request.user.id).exists():
            context['invited_user'] = False
        elif context['waitedInviteMsg'].exists():
            context['invited_user'] = True
        else :
            return redirect('/community')
    # deprecated -> user_board
    if board.board_type == 'User':
        if request.user.is_anonymous:
            return redirect('/community')
        return render(request, 'community/board/user-board.html', context)

    if board.board_type == 'Recruit':

        active_article = Article.objects.filter(board=board)
        active_article = active_article.filter(period_end__gte=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        for article in active_article:
            article.tags = [art_tag.tag for art_tag in ArticleTag.objects.filter(article=article)]
            teamrecruitarticle = TeamRecruitArticle.objects.filter(article=article).first()
            if teamrecruitarticle:
                article.team = teamrecruitarticle.team
            else:
                article.team = None

        team_cnt = len(TeamMember.objects.filter(member=account).prefetch_related('team'))
        context['team_cnt'] = team_cnt
        context['active_article'] = active_article
        context['active_article_tab'] = range(math.ceil(len(active_article) / 4))

    if board.board_type == 'Team':
        team = board.team
        team_tags = TeamTag.objects.filter(team=team).values('team', 'tag__name', 'tag__type')
        team_tags_list= []
        try:
            for atg in team_tags:
                team_tags_list.append({'name':atg["tag__name"], 'type':atg["tag__type"]})
        except Exception as e:
            print("error tag", e)
        
        team_members = TeamMember.objects.filter(team=team).order_by('-is_admin').prefetch_related('member__user')

        tm = team_members.filter(member=account).first()
        # if not tm:
        #     return redirect('/community')
        if tm:
            context['team_admin'] = tm.is_admin
        context['team'] = team
        context['team_tags'] = team_tags_list
        context['team_members'] = team_members
        
    return render(request, 'community/board/board.html', context)
