from django.shortcuts import render
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
from user.models import GitHubScoreTable
from django.db.models import Count
import json, time

# Create your views here.
@login_required
def statistic(request):
    start_year = 2019
    if not request.user.is_superuser:
        return redirect(f'/user/{request.user.username}')
    context = {}
    start = time.time()  # 시작 시간 저장
    dept_set = GitHubScoreTable.objects.values("dept").annotate(Count("dept"))
    context["dept_list"] = json.dumps([ dept["dept"] for dept in dept_set], ensure_ascii=False)
    
    annual_overview = AnnualOverview.objects.order_by("case_num")
    annual_overview_list = [overview.to_json() for overview in annual_overview]
    for case in range(4):
        chartdata = {}
        
        # 1. MODEL AnnualOverview
        key_name = "annual_overview"
        chartdata[key_name] = json.dumps([annual_overview_list[case]])
        
        # 2. MODEL AnnualTotal
        annual_total = AnnualTotal.objects.filter(case_num=case)
        key_name = "annual_total"
        chartdata[key_name] = json.dumps([row.to_json() for row in annual_total])
        dist_score_total = DistScore.objects.filter(case_num=case).order_by('case_num')
        dist_factor = DistFactor.objects.filter(case_num=case).order_by('case_num')
        end_year = start_year + len(dist_score_total) - 1
        if case == 0:
            repo_list = Repository.objects.all()
            for year in range(start_year, end_year+1):
                repo_dict = {}
                for row in repo_list:
                    if row.year == year:
                        repo_pair = row.to_json()
                        repo_dict.update(repo_pair)
                key_name = "repo"+str(year)
                chartdata[key_name] = json.dumps([repo_dict])
            context["classGap"] = json.loads(annual_overview[case].fork)
            context["classCnt"] = json.loads(annual_overview[case].fork_std)
            
        for year in range(start_year, end_year+1):
            # 3. MODEL DistScore
            dist_score = dist_score_total[year-start_year]

            # # 딕셔너리를 리스트안에 미리 넣는 방식이라 접근이 힘듦
            annual_dist = dist_score.to_json()
            
            # 4. MODEL DistFactor
            for row in dist_factor:
                row_json = row.to_json()
                if row_json["year"] == year :
                    factor = row_json["factor"]
                    row_json[factor] = row_json.pop("value")
                    row_json[factor+"_sid"] = row_json.pop("value_sid")
                    row_json[factor+"_sid_std"] = row_json.pop("value_sid_std")
                    row_json[factor+"_sid_pct"] = row_json.pop("value_sid_pct")
                    row_json[factor+"_dept"] = row_json.pop("value_dept")
                    row_json[factor+"_dept_std"] = row_json.pop("value_dept_std")
                    row_json[factor+"_dept_pct"] = row_json.pop("value_dept_pct")
                    annual_dist.update(row_json)
                
            # print(annual_dist['issue_dept_pct'])
            key_name = "year"+str(year)
            chartdata[key_name] = json.dumps([annual_dist])
            
            # 5. MODEL Student
            student_list = []
            if case == 0:
                student_list = Student.objects.filter(year=year)
            elif case == 1:
                student_list = Student.objects.filter(year=year, plural_major=0)
            elif case == 2:
                student_list = Student.objects.filter(year=year, absence=0, plural_major=case%2)
            elif case == 3:
                student_list = Student.objects.filter(year=year, absence=0, plural_major=0)
            key_name = "student"+str(year)
            chartdata[key_name] = json.dumps([row.to_json() for row in student_list])
        context["chartdata_"+str(case)] = json.dumps(chartdata)
        context["end_year"] = end_year
        context["year_list"] = [ year for year in range(start_year, end_year+1)]
    context['user_type'] = 'admin'
    print("time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간

    return render(request, 'home/statistic.html', context)
