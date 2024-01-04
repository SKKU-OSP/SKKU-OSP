from rest_framework import serializers

from tag import models


class LogoField(serializers.Field):
    '''
    models.FilePathField 를 직렬화 하기 위한 Serializer
    '''

    def to_representation(self, value):
        return str(value)


class TagIndependentSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.TagIndependent
        fields = (
            "name",
            "type",
            "logo",
            "color",
        )
