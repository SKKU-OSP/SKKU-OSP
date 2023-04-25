from django.contrib import admin
from .models import StudentTab, Account, GitHubScoreTable
# Register your models here.

class AccountAdmin(admin.ModelAdmin):
    search_fields = ['github_id']
    list_display = ('get_user_username', 'get_student_id', 'github_id')
    @admin.display(description='user username', ordering='user__username')
    def get_user_username(self, obj):
        return obj.user.username
    @admin.display(description='student_data id', ordering='student_data__id')
    def get_student_id(self, obj):
        return obj.student_data_id

class StudentAdmin(admin.ModelAdmin):
    search_fields = ['id', 'name', 'github_id']
    list_display = ('id', 'name', 'github_id', 'college', 'dept', 'personal_email')

class GitHubScoreTableAdmin(admin.ModelAdmin):
    search_fields = ['name', 'github_id']
    list_display = ('name', 'github_id', 'year', 'total_score', 'commit_cnt', 'commit_line', 'issue_cnt', 'pr_cnt', 'repo_cnt')

admin.site.register(StudentTab, StudentAdmin)
admin.site.register(Account, AccountAdmin)
admin.site.register(GitHubScoreTable, GitHubScoreTableAdmin)
