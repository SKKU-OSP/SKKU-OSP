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
    
    # 5. MODEL Student
    def getStudentYear(end_year):
        stdnt_case_list = [[[] for i in range(start_year, end_year+1)] for j in range(4)]
        stdnt_list = Student.objects.all()
        for stdnt_data in stdnt_list:
            stdnt_json = stdnt_data.to_json()
            yid = stdnt_data.year - start_year
            if stdnt_data.absence == 0 and stdnt_data.plural_major == 0 :
                stdnt_case_list[0][yid].append(stdnt_json)
                stdnt_case_list[1][yid].append(stdnt_json)
                stdnt_case_list[2][yid].append(stdnt_json)
                stdnt_case_list[3][yid].append(stdnt_json)
            elif stdnt_data.absence == 0 and stdnt_data.plural_major == 1 :
                stdnt_case_list[0][yid].append(stdnt_json)
                stdnt_case_list[2][yid].append(stdnt_json)
            elif stdnt_data.absence >= 1 and stdnt_data.plural_major == 0 :
                stdnt_case_list[0][yid].append(stdnt_json)
                stdnt_case_list[1][yid].append(stdnt_json)
            elif stdnt_data.absence >= 1 and stdnt_data.plural_major == 1 :
                stdnt_case_list[0][yid].append(stdnt_json)
        return stdnt_case_list

    annual_total_list = AnnualTotal.objects.order_by('case_num')
    annual_total = [[] for i in range(4)]
    for annual_data in annual_total_list:
        annual_total[annual_data.case_num].append(annual_data.to_json())
    
    dist_score_total_list = DistScore.objects.order_by('case_num')
    dist_score_total = [[] for i in range(4)]
    for dist_score in dist_score_total_list:
        dist_score_total[dist_score.case_num].append(dist_score.to_json())
    dist_factor_list = DistFactor.objects.order_by('case_num')
    dist_factor = [[] for i in range(4)]
    for dist in dist_factor_list:
        dist_factor[dist.case_num].append(dist)
    for case in range(4):
        chartdata = {}
        
        # 1. MODEL AnnualOverview
        key_name = "annual_overview"
        chartdata[key_name] = json.dumps([annual_overview_list[case]])
        
        # 2. MODEL AnnualTotal
        chartdata["annual_total"] = json.dumps(annual_total[case])
        end_year = start_year + len(dist_score_total[case]) - 1
        if case == 0:
            stdnt_case_list = getStudentYear(end_year)
            repo_total_list = Repository.objects.all()
            repo_list = [ [] for i in range(end_year-start_year+1)]
            for repo in repo_total_list:
                if repo.year >= start_year:
                    repo_list[repo.year-start_year].append(repo.to_json())
            context["repo"] = json.dumps(repo_list)
            context["classNum"] = json.loads(annual_overview[case].class_num)
            context["levelStep"] = json.loads(annual_overview[case].level_step)
            
        for year in range(start_year, end_year+1):
            # 3. MODEL DistScore
            annual_dist = dist_score_total[case][year-start_year]
            # 4. MODEL DistFactor
            for row in dist_factor[case]:
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
            key_name = "year"+str(year)
            chartdata[key_name] = json.dumps([annual_dist])
        chartdata["student_year"] = json.dumps(stdnt_case_list[case])
        context["chartdata_"+str(case)] = json.dumps(chartdata)
    context["end_year"] = end_year
    context["year_list"] = [ year for year in range(start_year, end_year+1)]
    context["year_list"].reverse()
    context['user_type'] = 'admin'
    print("time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간

    return render(request, 'home/statistic.html', context)
