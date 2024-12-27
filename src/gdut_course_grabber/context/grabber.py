"""
提供抢课任务管理器上下文。
"""

from gdut_course_grabber.context import config
from gdut_course_grabber.models import Config
from gdut_course_grabber.utils.grabber import GrabberTaskManager

__all__ = ["grabber_task_manager"]

_PATH = "data/grabber.json"


def _init_task_manager() -> GrabberTaskManager:
    """
    从加载时配置初始化抢课任务管理器。

    Returns:
        GrabberTaskManager: 抢课任务管理器。
    """

    conf = config.load_config()
    return GrabberTaskManager(_PATH, conf.account)


@config.on_updated
def on_config_updated(conf: Config) -> None:
    """
    在配置更新时更新抢课任务管理器的帐户。

    Args:
        conf (Config): 更新后的配置。
    """

    grabber_task_manager.account = conf.account


grabber_task_manager = _init_task_manager()
"""
抢课任务管理器。
"""
