# Generated by Django 4.1.3 on 2024-07-08 20:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0035_qnaimage'),
    ]

    operations = [
        migrations.RenameField(
            model_name='qnaimage',
            old_name='image',
            new_name='file',
        ),
        migrations.RenameField(
            model_name='qnaimage',
            old_name='image_name',
            new_name='name',
        ),
        migrations.RenameField(
            model_name='qnaimage',
            old_name='image_size',
            new_name='size',
        ),
    ]
