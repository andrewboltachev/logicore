from main.views import MainView
from matcher.models import MatcherProject


class MatcherProjectsPage(MainView):
    in_menu = False
    url_path = "/matcher/"
    url_name = "matcher-projects"
    title = "Matcher"
    TEMPLATE = "MatcherProjects"
    WRAPPER = "FiddleWrapper"

    def get_data(self, request, *args, **kwargs):
        return {
            "items": list(MatcherProject.objects.values("id", "name")),
        }


class MatcherProjectPage(MainView):
    pass


class MatcherStratagemsPage(MainView):
    pass


class MatcherStratagemPage(MainView):
    pass