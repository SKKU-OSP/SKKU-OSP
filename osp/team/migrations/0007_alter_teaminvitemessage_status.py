# Generated by Django 4.1.3 on 2022-12-27 14:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('team', '0006_delete_teamrecruitarticle'),
    ]

    operations = [
        migrations.AlterField(
            model_name='teaminvitemessage',
            name='status',
            field=models.IntegerField(choices=[(0, '대기 중'), (1, '승인'), (2, '거절')], default=0),
        ),
    ]
