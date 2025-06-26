from pathlib import Path

import platformdirs

from gdut_course_grabber.utils.path import search_path

static_path = search_path(Path(__file__).parent, "static", max_depth=2)

platform_dirs = platformdirs.PlatformDirs(
    appname="GDUTCourseGrabber", appauthor="GDUTMeow", version="v3", ensure_exists=True
)
