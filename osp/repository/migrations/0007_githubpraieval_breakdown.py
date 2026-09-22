from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0006_githubpraieval'),
    ]

    operations = [
        migrations.AddField(
            model_name='GithubPrAiEvaluation',
            name='pr_total_score',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='GithubPrAiEvaluation',
            name='pr_breakdown',
            field=models.JSONField(blank=True, null=True),
        ),
    ]