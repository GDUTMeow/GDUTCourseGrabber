"""
提供存储管理器上下文。
"""

from gdut_course_grabber.context.path import platform_dirs
from gdut_course_grabber.utils.storage import StorageManager

__all__ = ["storage_manager"]

_PATH = platform_dirs.user_data_path / "storage"


storage_manager = StorageManager(_PATH, ensure_exists=True)
"""
存储管理器。
"""
