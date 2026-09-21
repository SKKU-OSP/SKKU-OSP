from django.conf import settings
from rest_framework.permissions import BasePermission


def can_use_ai_evaluation(user):
    """로그인한 관리자 또는 상용 환경의 파일럿 사용자만 허용한다."""
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    if getattr(user, 'is_superuser', False):
        return True
    return getattr(user, 'pk', None) in settings.AI_EVALUATION_ALLOWED_USER_IDS


class CanUseAiEvaluation(BasePermission):
    message = '현재 AI 평가 기능의 테스트 대상 사용자가 아닙니다.'

    def has_permission(self, request, view):
        return can_use_ai_evaluation(getattr(request, 'user', None))


class RequireAiEvaluationAccessMixin:
    """AI 평가 관련 GET·POST 전체에 동일한 파일럿 접근 권한을 적용한다."""

    permission_classes = [CanUseAiEvaluation]
