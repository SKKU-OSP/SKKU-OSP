from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from .models import Board, Article
from datetime import datetime, timedelta
# Create your views here.

@login_required
def main(request):
    board_list = []
    for board in Board.objects.all():
        week_ago = datetime.now() - timedelta(days=7)
        article_list = Article.objects.filter(board_id=board, 
                                              pub_date__range=[
                                                  week_ago.strftime('%Y-%m-%d'),
                                                  datetime.now().strftime('%Y-%m-%d')
                                              ])
        if len(article_list) > 0:
            article_list = article_list.order_by('-view_cnt')
            board.top_article = article_list[:min(3, len(article_list))]
        else:
            board.top_article = []
        board_list.append(board)
    print(board_list)
    return render(request, 'community/main.html', {'boards': board_list})

def board(request, board_name):
    try:
        board = Board.objects.get(name=board_name)
    except Board.DoesNotExist:
        return redirect('/community')
    print(board)
    return render(request, 'community/board.html', {'board': ''})