# Generated by Django 4.1.3 on 2024-07-23 20:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0018_heroarticle_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='heroarticle',
            name='thumbnail',
            field=models.ImageField(default='1', upload_to='img/hero/'),
        ),
    ]
