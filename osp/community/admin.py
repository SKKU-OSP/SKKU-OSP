from django.contrib import admin
from .models import *
from community.models import TeamRecruitArticle

# Register your models here.

class ArticleTagInline(admin.TabularInline):
    model = ArticleTag
    extra = 0
    
class TeamRecruitArticleInline(admin.TabularInline):
    model = TeamRecruitArticle
    extra = 1

class ArticleAdmin(admin.ModelAdmin):
    inlines = [ArticleTagInline, TeamRecruitArticleInline]
    list_display = ('title', 'board_id', 'writer', 'pub_date')

admin.site.register(Board)
admin.site.register(Article, ArticleAdmin)
admin.site.register(ArticleTag)
admin.site.register(ArticleLike)
admin.site.register(ArticleComment)
admin.site.register(ArticleCommentLike)