from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0009_githubissueaievaluation'),
    ]

    operations = [
        migrations.AddField(
            model_name='githubissueaievaluation',
            name='issue_type',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]