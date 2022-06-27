from django.shortcuts import render
from .models import Board
from django.shortcuts import redirect
# Create your views here.

def main(request):
    return render(request, 'community/main.html')

def board(request, board_name):
    try:
        board = Board.objects.get(name=board_name)
    except Board.DoesNotExist:
        return redirect('/community')
    print(board)
    return render(request, 'community/board.html', {'board': ''})