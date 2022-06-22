from django.db import models

# Create your models here.
class Tag(models.Model):
    name = models.CharField(primary_key=True, max_length=20)
    type = models.CharField(max_length=20)

class LanguageExtension(models.Model):
    ext = models.CharField(primary_key=True, max_length=20)
    language = models.ForeignKey(Tag, models.CASCADE)