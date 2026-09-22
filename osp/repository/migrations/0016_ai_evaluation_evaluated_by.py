from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0015_aievaluationusage_failure_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='githubrepoaievaluation',
            name='evaluated_by',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
        migrations.AddField(
            model_name='githubpraievaluation',
            name='evaluated_by',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
        migrations.AddField(
            model_name='githubissueaievaluation',
            name='evaluated_by',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
        migrations.AddField(
            model_name='githubcommitaievaluation',
            name='evaluated_by',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
    ]
