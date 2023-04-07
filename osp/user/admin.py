from django.contrib import admin
from .models import StudentTab, Account, GitHubScoreTable
# Register your models here.

class AccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_data')

class StudentAdmin(admin.ModelAdmin):
    search_fields = ['id', 'name', 'github_id']
    list_display = ('id', 'name', 'github_id', 'college', 'dept', 'personal_email')

class GitHubScoreTableAdmin(admin.ModelAdmin):
    search_fields = ['name', 'github_id']
    list_display = ('name', 'github_id', 'year', 'total_score', 'commit_cnt', 'commit_line', 'issue_cnt', 'pr_cnt', 'repo_cnt')

admin.site.register(StudentTab, StudentAdmin)
admin.site.register(Account, AccountAdmin)
admin.site.register(GitHubScoreTable, GitHubScoreTableAdmin)
