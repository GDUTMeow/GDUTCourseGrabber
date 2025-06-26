"""
提供路径上下文。
"""

from pathlib import Path

import platformdirs

from gdut_course_grabber.utils.path import search_path

static_path = search_path(Path(__file__).parent.parent, "static", max_depth=2)
"""
静态资源路径。
"""

platform_dirs = platformdirs.PlatformDirs(
    appname="GDUTCourseGrabber", appauthor="GDUTMeow", version="v3", ensure_exists=True
)
"""
平台相关文件夹。
"""
