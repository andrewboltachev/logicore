import asyncio

asyncio.sleep()

# давай первое значение
# давай следующее значение, и прими x
# давай следующее значение
# ...

def gen():
    print("before")
    try:
        x = yield 42
    except GeneratorExit:
        pass
    else:
        print("x", x)
    yield 2
    yield 3
    print("after")
    return 111

if __name__ == '__main__':
    g = gen()
    g.send(None)
    g.close()
    g.send("foo!")
    next(g)