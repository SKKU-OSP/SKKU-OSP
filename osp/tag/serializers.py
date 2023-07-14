from rest_framework import serializers
from tag import models


class LogoField(serializers.Field):
    '''
    models.FilePathField 를 직렬화 하기 위한 Serializer
    '''

    def to_representation(self, value):
        return str(value)  # 또는 value.url 등 적절한 직렬화 방식을 사용해야 합니다.


class TagIndependentSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.TagIndependent
        fields = (
            "name",
            "type",
            "logo",
            "color",
        )
