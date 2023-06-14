from django.contrib import admin
from .models import Tag, LanguageExtension, DomainLayer, TagIndependent
# Register your models here.

class LanguageExtensionAdmin(admin.ModelAdmin):
    list_display = ('ext', 'language')
    
class DomainLayerAdmin(admin.ModelAdmin):
    list_display = ('parent_tag', 'child_tag')

class TagAdmin(admin.ModelAdmin):
    search_fields = ["name", "type"]
    list_display = ('name', 'type', 'logo', 'color')

class TagIndependentAdmin(admin.ModelAdmin):
    search_fields = ["name", "type"]
    list_display = ('name', 'type', 'logo', 'color')

admin.site.register(LanguageExtension, LanguageExtensionAdmin)
admin.site.register(DomainLayer, DomainLayerAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(TagIndependent, TagIndependentAdmin)
