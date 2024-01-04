from django.contrib import admin

from home.models import AnnualTotal, Repository, Student


class AnnualTotalAdmin(admin.ModelAdmin):
    list_display = ('case_num', 'student_KP', 'student_total',
                    'commit', 'star', 'repo', 'repo_total')


class StudentAdmin(admin.ModelAdmin):
    search_fields = ['github_id']
    list_display = ('github_id', 'year', 'score', 'commit',
                    'star', 'pr', 'issue', 'fork')


class RepositoryAdmin(admin.ModelAdmin):
    search_fields = ['owner']
    list_display = ('year', 'owner', 'repo_num')


admin.site.register(AnnualTotal, AnnualTotalAdmin)
admin.site.register(Student, StudentAdmin)
admin.site.register(Repository, RepositoryAdmin)
