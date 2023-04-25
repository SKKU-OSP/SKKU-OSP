# Generated by Django 4.1.3 on 2023-04-25 09:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0027_githuboverview_crawled_date'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='account',
            name='profile_open',
        ),
        migrations.RemoveField(
            model_name='account',
            name='recommend_open',
        ),
        migrations.AddField(
            model_name='account',
            name='github_id',
            field=models.TextField(null=True),
        ),
    ]
