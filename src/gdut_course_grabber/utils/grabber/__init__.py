"""
提供 Grabber (抢课工具) 相关的实用工具。
"""

import os
from dataclasses import dataclass
from types import MappingProxyType

from pydantic import TypeAdapter

from gdut_course_grabber.core.grabber import Grabber
from gdut_course_grabber.models import GrabberTask


@dataclass(kw_only=True)
class GrabberEntry:
    """
    抢课工具条目。

    指示抢课工具及其相关联的抢课任务。
    """

    task: GrabberTask
    conductor: Grabber


class GrabberTaskManager:
    """
    抢课任务管理器。

    提供抢课任务的托管及持久化支持。
    """

    _grabbers: dict[int, GrabberEntry]
    _next_id: int

    path: str | os.PathLike[str]

    @property
    def grabbers(self) -> MappingProxyType[int, GrabberEntry]:
        """
        抢课条目。
        """

        return MappingProxyType(self._grabbers)

    def __init__(self, path: str | os.PathLike[str]) -> None:
        """
        初始化 `GrabberTaskManager`。

        Args:
            path (str): 抢课任务持久化路径。
        """

        self._grabbers = {}
        self._next_id = 0
        self.path = path

        self._load_tasks()

    def _load_tasks(self) -> None:
        """
        从文件载入抢课任务。
        """

        if not os.path.exists(self.path):
            return

        with open(self.path, "rb") as fp:
            json = fp.read()

        tasks = TypeAdapter(list[GrabberTask]).validate_json(json)

        for task in tasks:
            self.add_task(task)

    def _save_tasks(self) -> None:
        """
        持久化抢课任务至文件。
        """

        tasks = [grabber.task for grabber in self._grabbers.values()]
        json = TypeAdapter(list[GrabberTask]).dump_json(tasks)

        with open(self.path, "wb") as fp:
            fp.write(json)

    def _create_grabber(self, task: GrabberTask) -> Grabber:
        """
        将抢课任务解析为抢课工具。

        Args:
            task (GrabberTask): 待解析的抢课任务。

        Returns:
            Grabber: 从指定抢课任务解析创建的抢课工具。
        """

        return Grabber(task.account, task.config, task.courses)

    async def update_task(self, id: int, task: GrabberTask) -> None:
        """
        更新抢课任务。

        Args:
            id (int): 抢课任务 ID。
            task (GrabberTask): 将要更新为的抢课任务。
        """

        self._grabbers[id].task = task
        self._save_tasks()

        await self.reset_task(id)

    async def destroy_task(self, id: int) -> None:
        """
        销毁抢课任务。

        Args:
            id (int): 抢课任务 ID。
        """

        await self._grabbers[id].conductor.cancel()

        del self._grabbers[id]
        self._save_tasks()

    async def reset_task(self, id: int) -> None:
        """
        重置抢课任务。

        Args:
            id (int): 抢课任务 ID。
        """

        entry = self._grabbers[id]
        await entry.conductor.cancel()

        entry.conductor = self._create_grabber(entry.task)

    def add_task(self, task: GrabberTask) -> int:
        """
        添加抢课任务。

        Args:
            task (GrabberTask): 待添加的抢课任务。

        Returns:
            int: 抢课任务 ID。
        """

        grabber = self._create_grabber(task)
        entry = GrabberEntry(task=task, conductor=grabber)

        id = self._next_id
        self._grabbers[id] = entry
        self._save_tasks()

        self._next_id += 1

        return id
