# Generated by Django 4.1.3 on 2023-08-21 17:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('team', '0009_teamapplymessage'),
    ]

    operations = [
        migrations.AlterField(
            model_name='team',
            name='name',
            field=models.CharField(max_length=20, unique=True),
        ),
    ]
