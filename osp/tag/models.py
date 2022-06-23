from django.db import models

# Create your models here.
class Tag(models.Model):
    name = models.CharField(primary_key=True, max_length=20)
    type = models.CharField(max_length=20)

class LanguageExtension(models.Model):
    ext = models.CharField(primary_key=True, max_length=20)
    language = models.ForeignKey(Tag, models.CASCADE)
    
class DomainLayer(models.Model):
    parent_tag = models.ForeignKey(Tag, models.CASCADE, related_name='parent_tag')
    child_tag = models.ForeignKey(Tag, models.CASCADE, related_name='child_tag')