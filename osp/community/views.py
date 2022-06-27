from django.shortcuts import render
from .models import Board
from django.shortcuts import redirect
from django.views.generic import TemplateView

# Create your views here.

def main(request):
    return render(request, 'community/main.html')

def board(request, board_name):
    try:
        board = Board.objects.get(name=board_name)
    except Board.DoesNotExist:
        return redirect('/community')
    return render(request, 'community/board.html', {'board': '', 'board_name':board_name})


# class TeamView(TemplateView):
#
#     def get(self, request, *args, **kwargs):
#
#         context = self.get_context_data(request, *args, **kwargs)
#
#
#         # return render(request=request, template_name=self.template_name, context=context)
#         data = {}
#
#
#         return render(request, 'community/team.html', {'data': data})
#
#     # ajax 요청 시 POST로 처리됨.(owned/ contributed repository Tab)
#     # def post(self, request, *args, **kwargs):
#     #     context = self.get_context_data(request, *args, **kwargs)
#     #     # POST 요청 시 예외 처리 안함.
#     #     std = self.POST.get('student_id')
#     #     context['std'] = std
#     #
#     #     github_id = StudentTab.objects.first(id=std.id).github_id
#     #
#     #     context['cur_repo_type'] = self.POST.get('cur_repo_type')
#     #     context['repos'] = get_repos(context['cur_repo_type'], github_id)
#
#     def get_context_data(self, request, *args, **kwargs):
#         context = super().get_context_data(**kwargs)
#
#         return context