# Generated by Django 4.1.3 on 2024-05-02 05:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0016_heroarticle'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='is_hero',
            field=models.BooleanField(default=False),
        ),
    ]
