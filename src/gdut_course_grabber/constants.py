from pathlib import Path

import platformdirs

from gdut_course_grabber.utils.path import search_path

STATIC_PATH = search_path(Path(__file__).parent, "static", max_depth=2)

PLATFORM_DIRS = platformdirs.PlatformDirs("gdut_course_grabber", version="v3")
