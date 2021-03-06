# Generated by Django 3.2.12 on 2022-06-29 00:58

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tag', '0001_initial'),
        ('community', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ArticleTag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('article', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='community.article')),
                ('tag', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tag.tag')),
            ],
        ),
        migrations.AddConstraint(
            model_name='articletag',
            constraint=models.UniqueConstraint(fields=('article', 'tag'), name='unique_article_tag'),
        ),
    ]
