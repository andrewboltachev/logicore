import json

from channels.generic.websocket import AsyncWebsocketConsumer


class StratagemConsumer(AsyncWebsocketConsumer):
    def connect(self):
        print(f"Connected: {self.channel_name}")
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        self.send(text_data=json.dumps({"message": message + " " + self.channel_name}))