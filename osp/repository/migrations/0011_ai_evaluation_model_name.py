from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0010_githubissueaievaluation_issue_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='githubrepoaievaluation',
            name='model_name',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='githubpraievaluation',
            name='model_name',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='githubissueaievaluation',
            name='model_name',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
