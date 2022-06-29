from django.contrib import admin
from .models import Board, Article, ArticleLike, ArticleComment, ArticleCommentLike, ArticleTag

# Register your models here.
admin.site.register(Board)
admin.site.register(Article)
admin.site.register(ArticleTag)
admin.site.register(ArticleLike)
admin.site.register(ArticleComment)
admin.site.register(ArticleCommentLike)