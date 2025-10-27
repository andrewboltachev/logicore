import asyncio


async def foo():
    await asyncio.sleep(1)
    pass


@asyncio.coroutine
def aha():
    pass
