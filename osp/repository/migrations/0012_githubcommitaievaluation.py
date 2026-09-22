from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0011_ai_evaluation_model_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='GithubCommitAiEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('github_id', models.CharField(max_length=255)),
                ('repo_name', models.CharField(max_length=255)),
                ('sha', models.CharField(max_length=40)),
                ('model_name', models.CharField(blank=True, max_length=128, null=True)),
                ('commit_score', models.CharField(blank=True, max_length=10, null=True)),
                ('commit_total_score', models.FloatField(blank=True, null=True)),
                ('message_clarity_score', models.IntegerField(blank=True, null=True)),
                ('consistency_score', models.IntegerField(blank=True, null=True)),
                ('atomicity_score', models.IntegerField(blank=True, null=True)),
                ('convention_score', models.IntegerField(blank=True, null=True)),
                ('commit_breakdown', models.JSONField(blank=True, null=True)),
                ('commit_strengths', models.JSONField(blank=True, null=True)),
                ('commit_improvements', models.JSONField(blank=True, null=True)),
                ('commit_advice', models.JSONField(blank=True, null=True)),
                ('commit_missing', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'github_commit_ai_evaluation',
                'unique_together': {('github_id', 'repo_name', 'sha')},
            },
        ),
    ]
