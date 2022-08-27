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
            return 'passData'
        elif self == Message.passNetworkLayout:
            return 'passNetworkLayout'

    @property
    def label(self):
        if self == Message.passData:
            return 'passData'
        elif self == Message.passNetworkLayout:
            return 'passNetworkLayout'


async def _send(event_loop, executor, ws, args, func):
    buf = await event_loop.run_in_executor(executor, func, args)
    await ws.send(buf)


async def _serve(event_loop, executor, stop, host='0.0.0.0', port=9000):
    bound_handler = functools.partial(_handler,
                                      event_loop=event_loop,
                                      executor=executor)

    async with websockets.serve(bound_handler, host, port):
        await stop


async def _handler(ws, path, event_loop, executor):
    try:
        while True:
            recv_msg = await ws.recv()
            asyncio.ensure_future(
                _handle_message(event_loop, executor, ws, recv_msg))
    except websockets.ConnectionClosed as e:
        print(f'ConnectionClosed: {ws.remote_address}')
    except Exception as e:
        print(f'Unexpected exception {e}: {sys.exc_info()[0]}')


def _prepare_data(args):
    file_name = args['name']
    df = pd.read_csv(f'../data/{file_name}')
    df_json = df.to_json(orient='records')

    return json.dumps({'action': Message.passData, 'content': df_json})


def _prepare_network_layout(args):
    G = nx.Graph()
    G.add_nodes_from(args['nodes'])
    G.add_edges_from(args['links'])
    positions = nx.spring_layout(G)
    positions = np.array(list(
        positions.values()))  # converting from dict to array

    return json.dumps({
        'action': Message.passNetworkLayout,
        'content': positions.tolist()
    })


async def _handle_message(event_loop, executor, ws, recv_msg):
    m = json.loads(recv_msg)
    m_action = m['action']

    if m_action == Message.passData:
        await _send(event_loop, executor, ws, m['content'], _prepare_data)
    elif m_action == Message.passNetworkLayout:
        await _send(event_loop, executor, ws, m['content'],
                    _prepare_network_layout)


def start_websocket_server(host='0.0.0.0', port=9000, max_workers=4):
    if not sys.platform.startswith('win'):
        import uvloop
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

        event_loop = asyncio.get_event_loop()
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers)

        # The stop condition is set when receiving SIGINT.
        stop = asyncio.Future()

        event_loop.add_signal_handler(signal.SIGINT, stop.set_result, True)

        # Run the server until the stop condition is met.
        event_loop.run_until_complete(
            _serve(event_loop, executor, stop, host, port))
    else:  # windows
        # Windows cannot use uvloop library and signals
        asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())

        event_loop = asyncio.get_event_loop()
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers)

        stop = asyncio.Future()

        try:
            event_loop.run_until_complete(
                _serve(event_loop, executor, stop, host, port))
        finally:
            event_loop.close()


start_websocket_server(host='0.0.0.0', port=9000, max_workers=4)
