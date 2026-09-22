from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0004_githubrepoaievaluation_readme_missing_essentials_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='githubrepoaievaluation',
            name='readme_criteria_scores',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='githubrepoaievaluation',
            name='readme_total_score',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='GithubRepository',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('owner_name', models.CharField(max_length=255)),
                ('repo_name', models.CharField(max_length=255)),
                ('readme', models.TextField(blank=True, null=True)),
                ('license', models.CharField(blank=True, max_length=100, null=True)),
            ],
            options={
                'db_table': 'github_repository',
                'managed': False,
                'unique_together': {('owner_name', 'repo_name')},
            },
        ),
    ]