from django.contrib import admin
from community.models import Article
from .models import Team, TeamMember, TeamRecruitArticle, TeamTag
# Register your models here.

class TeamTagInline(admin.TabularInline):
    model = TeamTag
    extra = 3
    
class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1

class TeamRecruitArticleAdmin(admin.ModelAdmin):
    list_display = ('team', 'article')
    
class TeamAdmin(admin.ModelAdmin):
    inlines = [TeamTagInline, TeamMemberInline]

admin.site.register(Team, TeamAdmin)
admin.site.register(TeamMember)
admin.site.register(TeamRecruitArticle, TeamRecruitArticleAdmin)
admin.site.register(TeamTag)