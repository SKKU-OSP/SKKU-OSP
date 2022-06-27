from django.shortcuts import render
from .models import Board
from django.shortcuts import redirect
from django.views.generic import TemplateView

# Create your views here.

def board(request, board_name):
    board = Board.objects.filter(name=board_name)
    if len(board) == 0:
        return redirect('/community')
    return render(request, 'community/board.html', {'board': ''})


class TeamView(TemplateView):

    def get(self, request, *args, **kwargs):
        student_id = self.kwargs.get('student_id')

        context = self.get_context_data(request, *args, **kwargs)


        # return render(request=request, template_name=self.template_name, context=context)
        data = {}


        return render(request, 'profile/profile.html', {'data': data})

    # ajax 요청 시 POST로 처리됨.(owned/ contributed repository Tab)
    # def post(self, request, *args, **kwargs):
    #     context = self.get_context_data(request, *args, **kwargs)
    #     # POST 요청 시 예외 처리 안함.
    #     std = self.POST.get('student_id')
    #     context['std'] = std

    #     github_id = StudentTab.objects.first(id=std.id).github_id

    #     context['cur_repo_type'] = self.POST.get('cur_repo_type')
    #     context['repos'] = get_repos(context['cur_repo_type'], github_id)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)

        return context