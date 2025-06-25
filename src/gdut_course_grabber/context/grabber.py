"""
提供抢课任务管理器上下文。
"""

from gdut_course_grabber.constants import PLATFORM_DIRS
from gdut_course_grabber.utils.grabber import GrabberTaskManager

__all__ = ["grabber_task_manager"]

_PATH = PLATFORM_DIRS.user_data_path / "grabber.json"


grabber_task_manager = GrabberTaskManager(_PATH)
"""
抢课任务管理器。
"""
