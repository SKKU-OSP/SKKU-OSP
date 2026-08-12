from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0008_readme_evaluation_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='GithubIssueAiEvaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('github_id', models.CharField(max_length=40)),
                ('repo_name', models.CharField(max_length=100)),
                ('issue_number', models.IntegerField()),
                ('issue_score', models.CharField(blank=True, max_length=10, null=True)),
                ('issue_total_score', models.FloatField(blank=True, null=True)),
                ('issue_breakdown', models.JSONField(blank=True, null=True)),
                ('issue_strengths', models.JSONField(blank=True, null=True)),
                ('issue_improvements', models.JSONField(blank=True, null=True)),
                ('issue_advice', models.JSONField(blank=True, null=True)),
                ('issue_missing', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'github_issue_ai_evaluation',
                'unique_together': {('github_id', 'repo_name', 'issue_number')},
            },
        ),
    ]