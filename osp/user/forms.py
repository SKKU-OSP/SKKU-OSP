from django.forms import ModelForm
from .models import Account, AccountInterest, StudentTab

class ProfileInfoUploadForm(ModelForm):
    class Meta:
        model = StudentTab
        fields = ['plural_major', 'personal_email', 'primary_email', 'secondary_email']
        
class ProfileImgUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['photo']

class PortfolioUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['portfolio']

class IntroductionUploadForm(ModelForm):
    class Meta:
        model = Account
        fields = ['introduction']



