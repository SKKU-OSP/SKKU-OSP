# Generated by Django 3.2.12 on 2022-07-08 09:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0008_alter_githubstatsyymm_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='accountinterest',
            name='level',
            field=models.IntegerField(default=0),
        ),
    ]
