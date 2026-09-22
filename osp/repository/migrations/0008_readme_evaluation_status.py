from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0007_githubpraieval_breakdown'),
    ]

    operations = [
        migrations.AddField(
            model_name='githubrepoaievaluation',
            name='readme_evaluation_status',
            field=models.CharField(
                choices=[
                    ('code_only', '코드 분석만 완료'),
                    ('partial', '채점까지 완료'),
                    ('full', '전체 완료'),
                ],
                default='code_only',
                max_length=20,
            ),
        ),
    ]