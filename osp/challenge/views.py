from django.shortcuts import render
from django.contrib.auth.decorators import login_required

from user.models import Account
from .models import Challenge, ChallengeAchieve

# Create your views here.
@login_required
def challenge_list_view(request):
    challenge_list = Challenge.objects.all().values()
    achieved_list = ChallengeAchieve.objects.filter(account__user=request.user)
    context = {}
    return render(request, 'challenge/main.html', context)

@login_required
def challenge_acheive_update(request):
    challenge_list = Challenge.objects.all().values()
    achieved_list = ChallengeAchieve.objects.filter(account__user=request.user)
    
    pass

def check_challenge_acheive(user: Account, challenge: Challenge):
    pass