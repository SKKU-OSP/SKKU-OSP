import requests
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView


class AiEvaluationProxyView(APIView):
    """
    프론트엔드의 /v2/ai-evaluation/readme 요청을
    Spring 백엔드 /api/v2/ai-evaluation/readme로 프록시
    """

    def get(self, request):
        spring_url = getattr(settings, 'SPRING_BACKEND_URL', 'http://localhost:8080')
        try:
            res = requests.get(
                f'{spring_url}/api/v2/ai-evaluation/readme',
                params=request.GET.dict(),
                timeout=10
            )
            return JsonResponse(res.json(), status=res.status_code)
        except requests.RequestException as e:
            return JsonResponse({'status': 'fail', 'message': str(e)}, status=502)

    def post(self, request):
        spring_url = getattr(settings, 'SPRING_BACKEND_URL', 'http://localhost:8080')
        try:
            res = requests.post(
                f'{spring_url}/api/v2/ai-evaluation/readme',
                json=request.data,
                timeout=120
            )
            return JsonResponse(res.json(), status=res.status_code)
        except requests.RequestException as e:
            return JsonResponse({'status': 'fail', 'message': str(e)}, status=502)