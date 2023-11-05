from django.contrib import admin

from community.models import TeamRecruitArticle
from team.models import Team, TeamMember, TeamTag


class TeamTagInline(admin.TabularInline):
    model = TeamTag
    extra = 0


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0


class TeamRecruitArticleAdmin(admin.ModelAdmin):
    list_display = ('team', 'article')


class TeamAdmin(admin.ModelAdmin):
    inlines = [TeamTagInline, TeamMemberInline]
    list_display = ('id', 'name', 'get_member_cnt')

    def get_member_cnt(self, obj):
        return obj.teammember_set.count()


admin.site.register(Team, TeamAdmin)
admin.site.register(TeamMember)
admin.site.register(TeamRecruitArticle, TeamRecruitArticleAdmin)
admin.site.register(TeamTag)
