# Generated by Django 4.1.3 on 2023-01-28 16:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tag', '0002_tag_logo'),
    ]

    operations = [
        migrations.AddField(
            model_name='tag',
            name='color',
            field=models.CharField(default='#D3D3D3', max_length=10),
        ),
    ]
