import json
from functools import cached_property

from django.db.models import Max, F

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
        return self.model.objects.filter(**self.get_add_extra())

    def get_data(self, request, *args, **kwargs):
        return {
            "title": self.get_title(),
            "what": self.what,
            "items": list(self.get_queryset().values("id", "name", "is_favourite")),
            "detail_base": self.get_detail_base(),
            "breadcrumbs": self.get_breadcrumbs(),
        }

    def get_breadcrumbs(self):
        return [
            {"title": "Matcher"}
        ]

    def get_add_extra(self):
        return {}

    def post(self, request, *args, **kwargs):
        resp = {
            "navigate": self.request.get_full_path()[len("/api"):],
        }
        data = json.loads(request.body)["data"]
        match data["action"]:
            case "add":
                del data["action"]
                max_order = (
                    self.model.objects.filter(
                        **self.get_add_extra()
                    ).aggregate(Max("order"))["order__max"]
                    or 0
                )
                added = self.model.objects.create(
                    **data,
                    **self.get_add_extra(),
                    order=max_order + 1
                )
                resp = {
                    "navigate": f"{self.get_detail_base()}{added.id}/",
                }
            case "rename":
                del data["action"]
                item = self.model.objects.filter(
                    **self.get_add_extra(),
                ).get(pk=data["id"])
                del data["id"]
                for k, v in data.items():
                    setattr(item, k, v)
                item.save(update_fields=list(data.keys()))
            case "toggle_favourite":
                del data["action"]
                item = self.model.objects.filter(
                    **self.get_add_extra(),
                ).get(pk=data["id"])
                item.is_favourite = not item.is_favourite
                item.save(update_fields=["is_favourite"])
        return JsonResponse(resp)


class MatcherProjectPage(MatcherProjectsPage):
    url_path = "/matcher-projects/<str:id>/"
    url_name = "matcher-projects"
    model = MatcherStratagem
    what = "stratagem"

    def get_title(self):
        return f"Project: {self.get_parent.name}"

    def get_detail_base(self):
        return self.request.get_full_path()[len("/api"):] + "stratagem/"

    @cached_property
    def get_parent(self):
        return MatcherProject.objects.get(id=self.kwargs["id"])

    def get_breadcrumbs(self):
        return [
            {"title": "Matcher", "url": "/matcher/"},
            {"title": self.get_parent.name},
        ]

    def get_add_extra(self):
        return {"project_id": self.get_parent.id}


class MatcherStratagemPage(MainView):
    in_menu = False
    url_path = "/matcher-projects/<int:project_id>/stratagem/<int:id>/"
    url_name = "matcher-stratagem"
    title = "Matcher Projects"
    TEMPLATE = "MatcherStratagem"
    WRAPPER = "FiddleWrapper"
    model = MatcherProject
    what = "project"

    def get_title(self):
        return self.title

    def get_project(self):
        return MatcherProject.objects.get(id=self.kwargs["project_id"])

    def get_stratagem(self):
        return MatcherStratagem.objects.filter(project=self.get_project()).get(
            id=self.kwargs["id"]
        )

    def get_data(self, request, *args, **kwargs):
        return {
            "title": self.get_title(),
            "what": self.what,
            "breadcrumbs": self.get_breadcrumbs(),
        }

    def get_breadcrumbs(self):
        project = self.get_project()
        stratagem = self.get_stratagem()
        return [
            {"title": "Matcher", "url": "/matcher/"},
            {"title": project.name, "url": f"/matcher-projects/{project.id}/"},
            {"title": stratagem.name},
        ]

    # def post(self, request, *args, **kwargs):
    #     resp = {
    #         "navigate": self.request.get_full_path()[len("/api"):],
    #     }
    #     data = json.loads(request.body)["data"]
    #     if data["action"] == "add":
    #         del data["action"]
    #         added = self.model.objects.create(**data, **self.get_add_extra())
    #         resp = {
    #             "navigate": f"{self.get_detail_base()}{added.id}/",
    #         }
    #     return JsonResponse(resp)