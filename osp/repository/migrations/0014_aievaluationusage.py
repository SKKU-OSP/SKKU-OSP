from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0013_githubcommitfilesummarycache'),
    ]

    operations = [
        migrations.CreateModel(
            name='AiEvaluationUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('github_id', models.CharField(db_index=True, max_length=40)),
                ('eval_type', models.CharField(choices=[('readme', 'README'), ('pr', 'PR'), ('issue', 'Issue'), ('commit', 'Commit')], db_index=True, max_length=10)),
                ('target', models.JSONField(default=dict)),
                ('actual_cost', models.DecimalField(decimal_places=10, default=0, max_digits=16)),
                ('model_name', models.CharField(blank=True, default='', max_length=512)),
                ('status', models.CharField(choices=[('full', '전체 완료'), ('partial', '부분 완료'), ('code_only', '코드 분석만 완료'), ('skipped', '평가 제외'), ('failed', '실패')], default='failed', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'db_table': 'ai_evaluation_usage',
                'indexes': [
                    models.Index(fields=['github_id', 'created_at'], name='ai_usage_user_created_idx'),
                    models.Index(fields=['eval_type', 'created_at'], name='ai_usage_type_created_idx'),
                ],
            },
        ),
    ]
