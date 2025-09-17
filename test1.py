import asyncio

async def test_1():
    await asyncio.sleep(3)
    print('1')

async def test_2():
    await asyncio.sleep(1)
    print('2')

async def main():
    await test_1()
    #print('3')
    await test_2()

# 1 3 2

asyncio.run(main())

#async def main2():
#    await asyncio.gather(test_1(), test_2())
#    await asyncio.wait_for(test_1(), timeout=10)

#asyncio.run(main2())



