"""
提供路径相关实用工具。
"""

import itertools
from os import PathLike
from pathlib import Path


def search_path(origin: str | PathLike[str], name: str, *, max_depth: int = -1) -> Path:
    """
    由起始路径开始向前搜索路径。

    Args:
        origin (str | PathLike[str]): 起始路径。
        name (str): 文件或文件夹名称。
        max_depth (int, optional): 最大深度，当为 -1 时表示不限制。默认为 -1。

    Returns:
        Path: 搜索到的路径结果。
    """

    origin = Path(origin)

    if max_depth < -1:
        raise ValueError

    limits = range(max_depth + 1) if max_depth > 0 else itertools.count()
    paths = itertools.chain([origin], origin.parents)

    for _, root in zip(limits, paths):
        path = root / name

        if path.exists():
            return path

    raise FileNotFoundError
