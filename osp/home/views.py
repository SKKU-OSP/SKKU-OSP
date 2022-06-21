from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from home.models import AnnualOverview, AnnualTotal, DistFactor, DistScore, Repository, Student
import json
import time

# Create your views here.
@login_required
def statistic(request):
    
    context = dict()
    start = time.time()  # 시작 시간 저장
    #filter: case
    for case in range(4):
        chartdata = dict()
        
        # 1. MODEL AnnualOverview
        annual_overview = AnnualOverview.objects.filter(case_num=case)
        key_name = "annual_overview"
        chartdata[key_name] = json.dumps([row.to_json() for row in annual_overview])
        
        # 2. MODEL AnnualTotal
        annual_total = AnnualTotal.objects.filter(case_num=case)
        key_name = "annual_total"
        chartdata[key_name] = json.dumps([row.to_json() for row in annual_total])
        
        for year in range(2019, 2022):
            # 3. MODEL DistScore
            dist_score = DistScore.objects.filter(case_num=case, year=year).first()

            #chartdata[key_name] = json.dumps([row.to_json() for row in dist_score])
            # # 딕셔너리를 리스트안에 미리 넣는 방식이라 접근이 힘듦
            annual_dist = dist_score.to_json()
            
            # 4. MODEL DistFactor
            dist_factor = DistFactor.objects.filter(case_num=case, year=year)
            for row in dist_factor:
                row_json = row.to_json()
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
            # student_list = Student.objects.filter(year=year)
            if case == 0:
                student_list = Student.objects.filter(year=year)
            elif case == 1:
                student_list = Student.objects.filter(year=year, plural_major=0)
            elif case == 2:
                student_list = Student.objects.filter(year=year, absence=0, plural_major=case%2)
            elif case == 3:
                student_list = Student.objects.filter(year=year, absence=0, plural_major=0)
            # print("case",case,key_name,"len",len(student_list))
            key_name = "student"+str(year)
            chartdata[key_name] = json.dumps([row.to_json() for row in student_list])
            
            
            repo_list = Repository.objects.filter(year=year)
            repo_dict = dict()
            for row in repo_list:
                repo_pair = row.to_json()
                repo_dict.update(repo_pair)
            # print(repo_dict)
            key_name = "repo"+str(year)
            chartdata[key_name] = json.dumps([repo_dict])
            
        context["chartdata_"+str(case)] = json.dumps(chartdata)
        
    context['user_type'] = 'admin'
    #context = {"chartdata_":json.dumps(chartdata)}
    # print(context["chartdata_0"])
    # print(json.loads(context["chartdata_0"])["year2021"])
    print("time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간

    return render(request, 'home/statistic.html', context)