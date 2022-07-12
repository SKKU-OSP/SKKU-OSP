# Generated by Django 3.2.12 on 2022-07-12 09:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0009_accountinterest_level'),
        ('team', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='team',
            name='image',
            field=models.ImageField(default='default.jpg', upload_to='img/team/'),
        ),
        migrations.CreateModel(
            name='TeamInviteMessage',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('message', models.TextField(max_length=200)),
                ('status', models.IntegerField()),
                ('is_apply', models.BooleanField()),
                ('send_date', models.DateTimeField()),
                ('target_account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='user.account')),
                ('target_team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='team.team')),
            ],
        ),
    ]
