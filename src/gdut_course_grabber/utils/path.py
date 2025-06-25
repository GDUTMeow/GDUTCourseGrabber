import itertools
from os import PathLike
from pathlib import Path


def search_path(origin: str | PathLike[str], name: str, *, max_depth: int = -1) -> Path:
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
