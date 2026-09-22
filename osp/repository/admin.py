from django.contrib import admin

from .models import AiEvaluationUsage


@admin.register(AiEvaluationUsage)
class AiEvaluationUsageAdmin(admin.ModelAdmin):
    list_display = (
        'created_at', 'github_id', 'eval_type', 'status',
        'error_stage', 'error_category', 'actual_cost', 'model_name',
    )
    list_filter = ('eval_type', 'status', 'error_category', 'created_at')
    search_fields = (
        'github_id', 'model_name', 'error_code', 'error_message',
    )
    readonly_fields = (
        'github_id', 'eval_type', 'target', 'actual_cost',
        'model_name', 'status', 'error_stage', 'error_category',
        'error_code', 'error_message', 'created_at',
    )
