from django.contrib import admin
from community.models import Article
from .models import Team, TeamMember, TeamRecruitArticle, TeamTag
# Register your models here.

class TeamRecruitArticleAdmin(admin.ModelAdmin):
    list_display = ('team', 'article')

admin.site.register(Team)
admin.site.register(TeamMember)
admin.site.register(TeamRecruitArticle, TeamRecruitArticleAdmin)
admin.site.register(TeamTag)