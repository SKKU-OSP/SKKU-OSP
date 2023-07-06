from django.http import JsonResponse
from django.views import View

from rest_framework.response import Response
from rest_framework.views import APIView

from tag.models import Tag, TagIndependent
from tag.serializers import TagIndependentSerializer


class TagListView(APIView):
    def get(self, request):
        res = {'status': None, 'message': None, 'data': None}
        data = {'tags': None}

        # 쿼리스트링 가져오기
        keyword = request.GET.get('keyword', None)
        target_type = request.GET.get('type', None)

        # keyword와 type 필터 추가
        filter_kwargs = {}
        if keyword:
            filter_kwargs['name__contains'] = keyword
        if target_type:
            filter_kwargs['type'] = target_type

        tags = TagIndependent.objects.filter(**filter_kwargs)

        # response 생성
        data['tags'] = TagIndependentSerializer(tags, many=True).data
        res['status'] = 'success'
        res['data'] = data

        return Response(res)


class TagCreateView(APIView):
    def get(self, request):
        return Response({"message": "post 요청을 사용하는 API 입니다."})

    def post(self, request):
        res = {'status': None, 'message': None, 'data': None}

        tag_type = request.data.get('type', None)
        tag_name = request.data.get('name', '')
        print(tag_type, tag_name)
        if not tag_type:
            res['status'] = 'fail'
            res['message'] = 'Type field is empty'
            return Response(res)

        if TagIndependent.objects.filter(name=tag_name).exists():
            res['status'] = 'fail'
            res['message'] = f'{tag_name} already exists'
            return Response(res)

        tag = TagIndependent.objects.create(
            name=tag_name, type=tag_type)
        tag.save()
        res['status'] = 'success'
        res['message'] = f'{tag_name} is created'
        res['data'] = {'tag': TagIndependentSerializer(tag).data}

        return Response(res)


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
                result.append((pos, {'name': row.name, 'type': row.type}))
        result = [x[1] for x in sorted(result, key=lambda x:x[0])]
        return JsonResponse({'status': 'success', 'data': result})

    def post(self, request):
        method = request.POST.get('method', '')
        if method == '':
            return JsonResponse({'status': 'fail', 'message': f'Method field is empty'})
        tag_name = request.POST.get('name', '')
        if tag_name == '':
            return JsonResponse({'status': 'fail', 'message': f'Name field is empty'})
        if method == 'create':
            if len(Tag.objects.filter(name=tag_name)) > 0:
                return JsonResponse({'status': 'fail', 'message': f'{tag_name} already exists'})
            tag_type = request.POST.get('type', '')
            if tag_type == '':
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
