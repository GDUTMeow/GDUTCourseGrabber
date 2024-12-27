"""
提供配置文件上下文。
"""

import os
from typing import Any, Callable

from gdut_course_grabber.models import Config

__all__ = [
    "load_config",
    "update_config",
]

_PATH = "data/config.json"


UpdatedHandler = Callable[[Config], Any]
"""
配置文件更新事件处理器。
"""

_updated_handlers: list[UpdatedHandler] = []
"""
已注册的配置文件更新事件处理器。
"""


def on_updated(handler: UpdatedHandler) -> UpdatedHandler:
    """
    注册配置文件更新事件。
    """

    _updated_handlers.append(handler)
    return handler


def load_config() -> Config:
    """
    从文件中加载配置。

    Returns:
        Config: 配置。
    """

    if not os.path.exists(_PATH):
        return Config()

    with open(_PATH, "r", encoding="utf-8") as fp:
        json = fp.read()
    return Config.model_validate_json(json)


def update_config(config: Config) -> None:
    """
    更新配置文件。

    Args:
        config (Config): 将要更新为的配置。
    """

    json = config.model_dump_json()

    with open(_PATH, "w", encoding="utf-8") as fp:
        fp.write(json)

    for handler in _updated_handlers:
        handler(config)
