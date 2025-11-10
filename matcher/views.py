import json
from functools import cached_property

from main.views import MainView, JsonResponse
from matcher.models import MatcherProject, MatcherStratagem


class MatcherProjectsPage(MainView):
    in_menu = False
    url_path = "/matcher/"
    url_name = "matcher-projects"
    title = "Matcher Projects"
    TEMPLATE = "SortableItemsList"
    WRAPPER = "FiddleWrapper"
    detail_base = "/matcher-projects/"
    model = MatcherProject
    what = "project"

    def get_title(self):
        return self.title

    def get_detail_base(self):
        return self.detail_base

    def get_queryset(self):
        return self.model.objects.all()

    def get_data(self, request, *args, **kwargs):
        return {
            "title": self.get_title(),
            "what": self.what,
            "items": list(self.get_queryset().values("id", "name")),
            "detail_base": self.get_detail_base(),
            "breadcrumbs": self.get_breadcrumbs(),
        }

    def get_breadcrumbs(self):
        return [
            {"title": "Matcher"}
        ]

    def post(self, request, *args, **kwargs):
        resp = {
            "navigate": self.request.get_full_path()[len("/api"):],
        }
        data = json.loads(request.body)["data"]
        if data["action"] == "add":
            del data["action"]
            added = MatcherProject.objects.create(**data)
            resp = {
                "navigate": f"/{self.get_detail_base()}/{added.id}/",
            }
        return JsonResponse(resp)


class MatcherProjectPage(MatcherProjectsPage):
    url_path = "/matcher-projects/<str:id>/"
    url_name = "matcher-projects"
    model = MatcherStratagem
    what = "stratagem"

    def get_title(self):
        return f"Project: {self.get_parent.name}"

    def get_detail_base(self):
        return self.request.get_full_path()[len("/api"):] + "/stratagem/"

    def get_queryset(self):
        return self.model.objects.filter(project_id=self.kwargs["id"])

    @cached_property
    def get_parent(self):
        return MatcherProject.objects.get(id=self.kwargs["id"])

    def get_breadcrumbs(self):
        return [
            {"title": "Matcher", "url": "/matcher/"},
            {"title": self.get_parent.name},
        ]


class MatcherStratagemsPage(MainView):
    pass


class MatcherStratagemPage(MainView):
    pass