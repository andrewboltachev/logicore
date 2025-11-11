from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r"ws/stratagem/<int:stratagem_id>/$", consumers.StratagemConsumer.as_asgi()),
]