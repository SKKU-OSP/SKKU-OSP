# Generated by Django 4.1.3 on 2023-01-26 10:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0021_accountprivacy'),
    ]

    operations = [
        migrations.AddField(
            model_name='githubscoretable',
            name='personal_email',
            field=models.CharField(default=None, max_length=100),
        ),
    ]