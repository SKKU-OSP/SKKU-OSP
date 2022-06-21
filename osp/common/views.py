from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from user.models import StudentTab, Account
from tag.models import *
import re

def register_page(request):
    if request.method == 'GET':
        return render(request, 'common/register.html')
    if request.method == 'POST':
        fail_reason = []
        if len(request.POST['username']) < 5:
            fail_reason.append('username은 5자 이상이여야 합니다.')
        if request.POST['password_check'] != request.POST['password']:
            fail_reason.append('password가 일치하지 않습니다.')
        if not re.match('[0-9]{10}', request.POST['student_id']) :
            fail_reason.append('학번 형식이 다릅니다.')
        if len(request.POST['name']) > 20:
            fail_reason.append('이름은 20자를 넘을 수 없습니다.')
        print(request.POST['dept'])
        if len(request.POST['dept']) > 45:
            fail_reason.append('학과은 45자를 넘을 수 없습니다.')
        if len(request.POST['personal_email']) > 100:
            fail_reason.append('이메일 주소는 100자를 넘을 수 없습니다.')
        if len(request.POST['primary_email']) > 100:
            fail_reason.append('이메일 주소는 100자를 넘을 수 없습니다.')
        if len(request.POST['secondary_email']) > 100:
            fail_reason.append('이메일 주소는 100자를 넘을 수 없습니다.')
        
        if len(fail_reason) > 0:
            return JsonResponse({'status': 'fail', 'message': fail_reason})
        user = User.objects.create_user(username=request.POST['username'], password=request.POST['password'])
        user.save()
        student_data = StudentTab.objects.create(
            id=request.POST['student_id'],
            name=request.POST['name'],
            college=request.POST['college'],
            dept=request.POST['dept'],
            github_id=request.POST['github_id'],
            absence=request.POST['absence'],
            plural_major=request.POST['plural_major'],
            personal_email=request.POST['personal_email'],
            primary_email=request.POST['primary_email'],
            secondary_email=request.POST['secondary_email']
        )
        student_data.save()
        Account.objects.create(user=user, student_data=student_data).save()
        return JsonResponse({'status': 'sucess'})

def username_dupcheck(request):
    request.POST['username']
    pass