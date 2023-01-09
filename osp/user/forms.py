from django.forms import ModelForm
from .models import Account
    
class ProfileImgUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['photo']

