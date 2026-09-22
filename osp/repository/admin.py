from django.contrib import admin

from .models import AiEvaluationUsage


@admin.register(AiEvaluationUsage)
class AiEvaluationUsageAdmin(admin.ModelAdmin):
    list_display = (
        'created_at', 'github_id', 'eval_type', 'status',
        'actual_cost', 'model_name',
    )
    list_filter = ('eval_type', 'status', 'created_at')
    search_fields = ('github_id', 'model_name')
    readonly_fields = (
        'github_id', 'eval_type', 'target', 'actual_cost',
        'model_name', 'status', 'created_at',
    )
