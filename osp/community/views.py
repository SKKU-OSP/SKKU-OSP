from django.shortcuts import render
from .models import Board
from django.shortcuts import redirect
# Create your views here.

def board(request, board_name):
    board = Board.objects.filter(name=board_name)
    if len(board) == 0:
        return redirect('/community')
    return render(request, 'community/board.html', {'board': ''})