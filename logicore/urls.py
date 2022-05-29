"""logicore URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from django.views.generic.base import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from main import views as main_views


api_views_patterns = [
    path(f"api{v.url_path}", v.as_view())
    for v in main_views.all_api_views()
]

urlpatterns = [
    path(
        "robots.txt",
        TemplateView.as_view(template_name="robots.txt", content_type="text/plain"),
    ),
    path('media-upload/', main_views.media_upload), # TODO protect?
    path('admin/', admin.site.urls),
    *api_views_patterns,
    re_path(r"api/.*", main_views.Error404ApiView.as_view()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + [
    re_path(r'^(?P<path>.*)$', main_views.HomeView.as_view()),
]


if settings.FRONTEND_DEV_MODE:
    urlpatterns = [
        re_path(r'^(?P<path>.*\.hot-update\.(js|json))$', main_views.hot_update), # \.[0-9a-z]{20}
        re_path('^react-static/(?P<path>.+)$', main_views.react_static),
    ] + urlpatterns
else:
    urlpatterns = (
        static("/react-static/", document_root=settings.BASE_DIR / "frontend" / "build" / "react-static")
        + urlpatterns
    )
