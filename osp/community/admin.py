from django.contrib import admin
from .models import *


class ArticleTagInline(admin.TabularInline):
    model = ArticleTag
    extra = 0


class TeamRecruitArticleInline(admin.TabularInline):
    model = TeamRecruitArticle
    max_num = 1
    extra = 0


class ArticleAdmin(admin.ModelAdmin):
    inlines = [ArticleTagInline, TeamRecruitArticleInline]
    list_display = ('title', 'board_id', 'writer')
    search_fields = ["title", "writer__user__username"]


admin.site.register(Board)
admin.site.register(Article, ArticleAdmin)
admin.site.register(ArticleTag)
admin.site.register(ArticleLike)
admin.site.register(ArticleComment)
admin.site.register(ArticleCommentLike)
