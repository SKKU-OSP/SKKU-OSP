from django.contrib import admin
from .models import StudentTab, Account
# Register your models here.

class AccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_data')

class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'github_id', 'college', 'dept', 'personal_email')

admin.site.register(StudentTab, StudentAdmin)
admin.site.register(Account, AccountAdmin)