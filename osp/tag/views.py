from django.http import JsonResponse
from django.views import View
from tag.models import Tag

# Create your views here.
class LanguageTagView(View):
    def get(self, request):
        keyword = request.GET.get('keyword', '')
        result = []
        for row in Tag.objects.filter(type='language'):
            pos = row.name.lower().find(keyword.lower())
            if pos >= 0:
                result.append((pos, row.name))
        result = [x[1] for x in sorted(result)]
        return JsonResponse({'status': 'success', 'data': result})
    
    def post(self, request):
        method = request.POST.get('method', '')
        if method == '' :
            return JsonResponse({'status': 'fail', 'message': f'Method field is empty'})
        lang_name = request.POST.get('name', '')
        if lang_name == '' :
            return JsonResponse({'status': 'fail', 'message': f'Name field is empty'})
        if method == 'create':
            if len(Tag.objects.filter(name=lang_name, type='language')) > 0:
                return JsonResponse({'status': 'fail', 'message': f'{lang_name} already exists'})
            Tag.objects.create(name=lang_name, type='language').save()
            return JsonResponse({'status': 'success', 'message': f'{lang_name} is created'})
        if method == 'delete':
            if len(Tag.objects.filter(name=lang_name, type='language')) == 0:
                return JsonResponse({'status': 'fail', 'message': f'{lang_name} doesn\'t exist'})
            x = Tag.objects.filter(name=lang_name, type='language')[0]
            x.delete()
            return JsonResponse({'status': 'success', 'message': f'{lang_name} is created'})
        return JsonResponse({'status': 'fail', 'message': f'{method} doesn\'t support'})