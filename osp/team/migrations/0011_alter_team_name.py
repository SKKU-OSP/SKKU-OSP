# Generated by Django 4.1.3 on 2023-11-05 22:23

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("team", "0010_alter_team_name"),
    ]

    operations = [
        migrations.AlterField(
            model_name="team",
            name="name",
            field=models.CharField(db_index=True, max_length=20, unique=True),
        ),
    ]
