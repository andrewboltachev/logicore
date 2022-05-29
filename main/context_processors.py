from django.conf import settings


def react(request):
    return {
        'FRONTEND_DEV_MODE': settings.FRONTEND_DEV_MODE,
    }
