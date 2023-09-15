from django.db import models
import json
# Create your models here.

# case 휴학생 복전생
#    0  포함   포함
#    1  포함   제외
#    2  제외   포함
#    3  제외   제외


class AnnualOverview(models.Model):

    id = models.BigAutoField(primary_key=True)
    # 리스트데이터를 json으로 인코딩하여 textfield에 저장하고
    # 읽어올 때, json디코딩으로 다시 리스트를 생성하는 방법 사용

    # 각 데이터 평균과 표준편차
    case_num = models.IntegerField(null=False)
    score = models.TextField(null=False)
    score_std = models.TextField(null=False)

    commit = models.TextField(null=False)
    commit_std = models.TextField(null=False)
    star = models.TextField(null=False)
    star_std = models.TextField(null=False)
    pr = models.TextField(null=False)
    pr_std = models.TextField(null=False)
    issue = models.TextField(null=False)
    issue_std = models.TextField(null=False)
    class_num = models.TextField(null=False, default="[10, 5, 5, 5, 5]")
    level_step = models.TextField(null=False, default="[0.5, 100, 2, 5, 2]")

    # dictionary 형태로 반환하여 js에서 사용할 수 있도록
    def to_json(self):
        return {
            "case_num": self.case_num,
            "score": json.loads(self.score),
            "score_std": json.loads(self.score_std),
            "commit": json.loads(self.commit),
            "commit_std": json.loads(self.commit_std),
            "star": json.loads(self.star),
            "star_std": json.loads(self.star_std),
            "pr": json.loads(self.pr),
            "pr_std": json.loads(self.pr_std),
            "issue": json.loads(self.issue),
            "issue_std": json.loads(self.issue_std),
            "class_num": json.loads(self.class_num),
            "level_step": json.loads(self.level_step)
        }


# 합계 3점 이상 인원, 총 Commit, Star, Repo 수
class AnnualTotal(models.Model):

    id = models.BigAutoField(primary_key=True)
    case_num = models.IntegerField(null=False)
    # 기존 3점 이상 인원
    student_KP = models.TextField(null=False)
    student_total = models.TextField(null=False, default="[1, 1, 1]")

    commit = models.TextField(null=False)
    star = models.TextField(null=False)
    repo = models.TextField(null=False)
    # 2019년 이전의 repo도 전체 값에 포함
    repo_total = models.IntegerField(null=False)

    def to_json(self):
        return {
            "case_num": self.case_num,
            "student_KP": json.loads(self.student_KP),
            "student_total": json.loads(self.student_total),
            "commit": json.loads(self.commit),
            "star": json.loads(self.star),
            "repo": json.loads(self.repo),
            "repo_total": self.repo_total
        }

# 전체 Score 분포, 학번별 Score 분포, 학과별 Score 분포


class DistScore(models.Model):

    id = models.BigAutoField(primary_key=True)
    case_num = models.IntegerField(null=False)
    year = models.IntegerField(null=False)

    # 전체 Score 분포,  list size = 10
    score = models.TextField(null=False)

    # 학번별 Score 분포, 표준편차
    score_sid = models.TextField(null=False)
    score_sid_std = models.TextField(null=False)
    # 학번별 아웃라이어(Top5)
    score_sid_pct = models.TextField(
        null=False, default="[[],[],[],[],[],[],[]]")

    # 학과별 Score 분포, 표준편차
    score_dept = models.TextField(null=False)
    score_dept_std = models.TextField(null=False)
    # 학과별 아웃라이어(Top5)
    score_dept_pct = models.TextField(null=False, default="[[],[],[]]")

    def to_json(self):
        return {
            "case_num": self.case_num,
            "year": self.year,
            "score": json.loads(self.score),

            "score_sid": json.loads(self.score_sid),
            "score_sid_std": json.loads(self.score_sid_std),
            "score_sid_pct": json.loads(self.score_sid_pct),

            "score_dept": json.loads(self.score_dept),
            "score_dept_std": json.loads(self.score_dept_std),
            "score_dept_pct": json.loads(self.score_dept_pct),
        }

# Factor: Commits, Stars, Pull Requests, Issues


class DistFactor(models.Model):

    id = models.BigAutoField(primary_key=True)
    case_num = models.IntegerField(null=False)
    year = models.IntegerField(null=False)
    factor = models.CharField(max_length=10, null=False)

    # 전체 Score 분포,  list size = 10
    value = models.TextField(null=False)

    # 학번별 Score 분포, 표준편차
    value_sid = models.TextField(null=False)
    value_sid_std = models.TextField(null=False)
    # 학번별 아웃라이어(Top5)
    value_sid_pct = models.TextField(null=False)

    # 학과별 Score 분포, 표준편차
    value_dept = models.TextField(null=False)
    value_dept_std = models.TextField(null=False)
    # 학과별 아웃라이어(Top5)
    value_dept_pct = models.TextField(null=False)

    def to_json(self):
        return {
            "case_num": self.case_num,
            "year": self.year,
            "factor": self.factor,
            "value": json.loads(self.value),
            "value_sid": json.loads(self.value_sid),
            "value_sid_std": json.loads(self.value_sid_std),
            "value_sid_pct": json.loads(self.value_sid_pct),
            "value_dept": json.loads(self.value_dept),
            "value_dept_std": json.loads(self.value_dept_std),
            "value_dept_pct": json.loads(self.value_dept_pct)
        }


class Student(models.Model):

    id = models.BigAutoField(primary_key=True)
    # year로 필터 걸 수 있도록
    year = models.IntegerField(null=False)
    github_id = models.CharField(max_length=40, null=False)
    absence = models.IntegerField(null=False)
    plural_major = models.IntegerField(null=False)
    score = models.CharField(max_length=10, null=False)
    commit = models.IntegerField(null=False, default=0)
    star = models.IntegerField(null=False, default=0)
    pr = models.IntegerField(null=False, default=0)
    issue = models.IntegerField(null=False, default=0)
    fork = models.IntegerField(null=False, default=0)

    def to_json(self):
        return {
            "year": self.year,
            "github_id": self.github_id,
            "absence": self.absence,
            "plural_major": self.plural_major,
            "score": self.score,
            "commit": self.commit,
            "star": self.star,
            "pr": self.pr,
            "issue": self.issue,
        }

    def __str__(self) -> str:
        return f'{self.year}:{self.github_id}'


class Repository(models.Model):

    id = models.BigAutoField(primary_key=True)
    year = models.IntegerField(null=False)
    owner = models.CharField(max_length=40, null=False)
    repo_num = models.IntegerField(null=False)

    def to_json(self):
        return {
            self.owner: self.repo_num
        }

    def __str__(self) -> str:
        return f'{self.year}:{self.owner}'
