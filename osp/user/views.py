from django.shortcuts import render
from django.views.generic import TemplateView

# Create your views here.

class ProfileView(TemplateView):
    template_name = 'profile.html'

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request, *args, **kwargs)

        return render(request=request, template_name=self.template_name, context=context)

    def get_context_data(self, request, *args, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
