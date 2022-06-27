from django.contrib import admin
from .models import Tag, LanguageExtension, DomainLayer
# Register your models here.

class LanguageExtensionAdmin(admin.ModelAdmin):
    list_display = ('ext', 'language')
    
class DomainLayerAdmin(admin.ModelAdmin):
    list_display = ('parent_tag', 'child_tag')
    
admin.site.register(LanguageExtension, LanguageExtensionAdmin)
admin.site.register(DomainLayer, DomainLayerAdmin)
admin.site.register(Tag)