# Generated by Django 3.2.12 on 2022-08-02 16:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0013_devtype'),
    ]

    operations = [
        migrations.CreateModel(
            name='GitHubScoreTable',
            fields=[
                ('a_id', models.AutoField(primary_key=True, serialize=False)),
                ('id', models.IntegerField()),
                ('year', models.IntegerField()),
                ('name', models.CharField(max_length=20)),
                ('github_id', models.CharField(max_length=40)),
                ('total_score', models.FloatField()),
                ('commit_cnt', models.IntegerField()),
                ('commit_line', models.IntegerField()),
                ('issue_cnt', models.IntegerField()),
                ('pr_cnt', models.IntegerField()),
                ('repo_cnt', models.IntegerField()),
                ('dept', models.CharField(max_length=45)),
                ('absence', models.IntegerField()),
                ('plural_major', models.IntegerField()),
            ],
        ),
        migrations.AddConstraint(
            model_name='githubscoretable',
            constraint=models.UniqueConstraint(fields=('id', 'year'), name='id_year_constraint'),
        ),
    ]
