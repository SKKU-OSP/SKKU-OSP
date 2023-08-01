# Generated by Django 4.1.3 on 2023-07-30 21:10

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0029_alter_account_github_id_alter_account_introduction_and_more'),
        ('team', '0008_alter_teamtag_tag'),
    ]

    operations = [
        migrations.CreateModel(
            name='TeamApplyMessage',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('message', models.TextField(max_length=200)),
                ('status', models.IntegerField(choices=[(0, '대기 중'), (1, '승인'), (2, '거절')], default=0)),
                ('direction', models.BooleanField(choices=[(True, 'TO_ACCOUNT'), (False, 'TO_TEAM')], default=True)),
                ('send_date', models.DateTimeField()),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='user.account')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='team.team')),
            ],
        ),
    ]