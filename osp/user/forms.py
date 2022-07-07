from django.forms import ModelForm
from .models import Account

class PortfolioUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['portfolio']

class ProfileImgUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['photo']