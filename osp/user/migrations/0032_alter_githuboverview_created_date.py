# Generated by Django 4.1.3 on 2023-10-24 11:50

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("user", "0031_alter_devtype_typea_alter_devtype_typeb_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="githuboverview",
            name="created_date",
            field=models.DateTimeField(),
        ),
    ]
