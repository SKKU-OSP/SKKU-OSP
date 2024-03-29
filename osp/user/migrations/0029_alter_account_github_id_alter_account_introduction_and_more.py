# Generated by Django 4.1.3 on 2023-06-14 13:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0028_remove_account_profile_open_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='github_id',
            field=models.CharField(max_length=40, null=True),
        ),
        migrations.AlterField(
            model_name='account',
            name='introduction',
            field=models.TextField(blank=True, default='', null=True),
        ),
        migrations.AlterField(
            model_name='account',
            name='portfolio',
            field=models.TextField(blank=True, default='', null=True),
        ),
    ]
