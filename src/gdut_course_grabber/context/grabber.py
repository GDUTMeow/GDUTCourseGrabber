"""
提供抢课任务管理器上下文。
"""

from gdut_course_grabber.utils.grabber import GrabberTaskManager

__all__ = ["grabber_task_manager"]

_PATH = "data/grabber.json"


grabber_task_manager = GrabberTaskManager(_PATH)
"""
抢课任务管理器。
"""
