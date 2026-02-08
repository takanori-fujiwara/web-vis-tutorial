# Standard Library
import asyncio
import concurrent.futures
import functools
import json
import signal
import sys
from enum import IntEnum

# Third Party Library
import numpy as np
import pandas as pd
import networkx as nx
import websockets


class Message(IntEnum):
    passData = 0
    passNetworkLayout = 1

    @property
    def key(self):
        if self == Message.passData:
            return "passData"
        elif self == Message.passNetworkLayout:
            return "passNetworkLayout"

    @property
    def label(self):
        if self == Message.passData:
            return "passData"
        elif self == Message.passNetworkLayout:
            return "passNetworkLayout"


async def _send(executor, ws, args, func):
    event_loop = asyncio.get_running_loop()
    buf = await event_loop.run_in_executor(executor, func, args)
    await ws.send(buf)


async def _serve(executor, stop, host="0.0.0.0", port=9000):
    bound_handler = functools.partial(
        _handler, executor=executor
    )

    async with websockets.serve(bound_handler, host, port):
        await stop


async def _handler(ws, executor):
    try:
        while True:
            recv_msg = await ws.recv()
            asyncio.ensure_future(_handle_message(executor, ws, recv_msg))
    except websockets.ConnectionClosed as e:
        print(f"ConnectionClosed: {ws.remote_address}")
    except Exception as e:
        print(f"Unexpected exception {e}: {sys.exc_info()[0]}")


def _prepare_data(args):
    file_name = args["name"]
    df = pd.read_csv(f"../data/{file_name}")
    df_json = df.to_json(orient="records")

    return json.dumps({"action": Message.passData, "content": df_json})


def _prepare_network_layout(args):
    G = nx.Graph()
    G.add_nodes_from(args["nodes"])
    G.add_edges_from(args["links"])
    positions = nx.spring_layout(G)
    positions = np.array(list(positions.values()))  # converting from dict to array

    return json.dumps(
        {"action": Message.passNetworkLayout, "content": positions.tolist()}
    )


async def _handle_message(executor, ws, recv_msg):
    m = json.loads(recv_msg)
    m_action = m["action"]

    if m_action == Message.passData:
        await _send(executor, ws, m["content"], _prepare_data)
    elif m_action == Message.passNetworkLayout:
        await _send(executor, ws, m["content"], _prepare_network_layout)


async def start_websocket_server(host="0.0.0.0", port=9000, max_workers=4):
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)

    stop = asyncio.get_running_loop().create_future()

    if not sys.platform.startswith("win"):
        asyncio.get_running_loop().add_signal_handler(signal.SIGINT, stop.set_result, True)

    try:
        await _serve(executor, stop, host, port)
    finally:
        executor.shutdown(wait=True)


if not sys.platform.startswith("win"):
    import uvloop
    asyncio.run(
        start_websocket_server(host="0.0.0.0", port=9000, max_workers=4),
        loop_factory=uvloop.new_event_loop,
    )
else:
    asyncio.run(
        start_websocket_server(host="0.0.0.0", port=9000, max_workers=4)
    )
