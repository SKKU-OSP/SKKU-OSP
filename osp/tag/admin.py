from django.contrib import admin
from .models import Tag, LanguageExtension
# Register your models here.

class LanguageExtensionAdmin(admin.ModelAdmin):
    list_display = ('ext', 'language')
    
admin.site.register(LanguageExtension, LanguageExtensionAdmin)
admin.site.register(Tag)