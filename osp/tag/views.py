from django.http import JsonResponse
from django.views import View
from tag.models import Tag

# Create your views here.
class TagAPIView(View):
    def get(self, request):
        keyword = request.GET.get('keyword', '')
        target_type = request.GET.get('type', False)
        result = []
        for row in Tag.objects.all():
            if target_type and target_type != row.type:
                continue
            pos = row.name.lower().find(keyword.lower())
            if pos >= 0:
                result.append((pos, row.name))
        result = [x[1] for x in sorted(result)]
        return JsonResponse({'status': 'success', 'data': result})
    
    def post(self, request):
        method = request.POST.get('method', '')
        if method == '' :
            return JsonResponse({'status': 'fail', 'message': f'Method field is empty'})
        tag_name = request.POST.get('name', '')
        if tag_name == '' :
            return JsonResponse({'status': 'fail', 'message': f'Name field is empty'})
        if method == 'create':
            if len(Tag.objects.filter(name=tag_name)) > 0:
                return JsonResponse({'status': 'fail', 'message': f'{tag_name} already exists'})
            tag_type = request.POST.get('type', '')
            if tag_type == '' :
                return JsonResponse({'status': 'fail', 'message': f'Type field is empty'})
            Tag.objects.create(name=tag_name, type=tag_type).save()
            return JsonResponse({'status': 'success', 'message': f'{tag_name} is created'})
        if method == 'delete':
            if len(Tag.objects.filter(name=tag_name)) == 0:
                return JsonResponse({'status': 'fail', 'message': f'{tag_name} doesn\'t exist'})
            x = Tag.objects.filter(name=tag_name)[0]
            x.delete()
            return JsonResponse({'status': 'success', 'message': f'{tag_name} is created'})
        return JsonResponse({'status': 'fail', 'message': f'{method} doesn\'t support'})