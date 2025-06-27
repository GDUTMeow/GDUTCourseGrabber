import os
import uuid

from pydantic import TypeAdapter


class StorageManager:
    """
    存储管理器。
    """

    path: str | os.PathLike[str]
    """
    路径。
    """

    _index: dict[str, str]
    """
    索引。
    """

    def __init__(self, path: str | os.PathLike[str], *, ensure_exists: bool = False) -> None:
        """
        初始化 `StorageManager`。

        Args:
            path (str): 储存路径。
        """

        self.path = path
        self._index = {}

        if ensure_exists:
            os.makedirs(path, exist_ok=True)

        self._load_index()

    @property
    def _index_path(self) -> str:
        """
        索引路径。
        """

        return os.path.join(self.path, ".index")

    def _load_index(self) -> None:
        """
        加载索引。
        """

        if not os.path.exists(self._index_path):
            return

        with open(self._index_path, "rb") as fp:
            json = fp.read()

        self._index = TypeAdapter(dict[str, str]).validate_json(json)

    def _save_index(self) -> None:
        """
        保存索引。
        """

        json = TypeAdapter(dict[str, str]).dump_json(self._index)

        with open(self._index_path, "wb") as fp:
            fp.write(json)

    def set(self, key: str, value: bytes) -> None:
        """
        向指定键存储数据。

        Args:
            key (str): 用于存储数据的键。
            value (bytes): 所存储的数据。
        """

        filename = self._index.get(key)

        if filename is None:
            filename = str(uuid.uuid4())

            self._index[key] = filename
            self._save_index()

        path = os.path.join(self.path, filename)

        with open(path, "wb") as fp:
            fp.write(value)

    def get(self, key: str) -> bytes:
        """
        获取指定键相应存储数据。

        Args:
            key (str): 所需获取存储数据的键。

        Returns:
            bytes: 指定键相应存储数据。
        """

        filename = self._index[key]

        path = os.path.join(self.path, filename)

        with open(path, "rb") as fp:
            value = fp.read()

        return value
