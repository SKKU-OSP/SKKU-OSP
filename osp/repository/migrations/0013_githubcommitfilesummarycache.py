from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0012_githubcommitaievaluation'),
    ]

    operations = [
        migrations.CreateModel(
            name='GithubCommitFileSummaryCache',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('github_id', models.CharField(max_length=255)),
                ('repo_name', models.CharField(max_length=255)),
                ('sha', models.CharField(max_length=40)),
                ('summaries', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'github_commit_file_summary_cache',
                'unique_together': {('github_id', 'repo_name', 'sha')},
            },
        ),
    ]
