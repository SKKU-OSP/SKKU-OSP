from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repository', '0014_aievaluationusage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='aievaluationusage',
            name='status',
            field=models.CharField(
                choices=[
                    ('full', '전체 완료'),
                    ('partial', '부분 완료'),
                    ('code_only', '코드 분석만 완료'),
                    ('skipped', '평가 제외'),
                    ('rejected', '평가 입력 없음'),
                    ('failed', '실패'),
                ],
                default='failed',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='aievaluationusage',
            name='error_stage',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='aievaluationusage',
            name='error_category',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='aievaluationusage',
            name='error_code',
            field=models.CharField(blank=True, default='', max_length=128),
        ),
        migrations.AddField(
            model_name='aievaluationusage',
            name='error_message',
            field=models.TextField(blank=True, default=''),
        ),
    ]
