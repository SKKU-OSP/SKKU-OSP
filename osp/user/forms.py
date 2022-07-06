from django.forms import ModelForm
from .models import Account

class FileUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['photo', 'portfolio']
