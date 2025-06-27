def parse(pattern, value, path=None):
    if not path:
        path = []
    match pattern["type"]:
        case "MatchCons":
            if isinstance(value, list):
                if len(value):
                    #return {"type": "MatchConsResult", "pattern", parse(pattern["contents"][0]), path + ["MatchCons"])}
                    pass
                else:
                    pass
            else:
                pass
        case "MatchNil":
            if isinstance(value, list):
                if not len(value):
                    return {"type": "MatchNilResult"}