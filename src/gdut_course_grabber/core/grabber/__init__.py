"""
提供抢课工具。
"""

import asyncio
import logging
from datetime import datetime, timezone
from enum import IntEnum
from typing import Iterable

from gdut_course_grabber.models import Account, Course, GrabberConfig
from gdut_course_grabber.utils.eas import AuthorizationFailed, EasClient

logger = logging.getLogger(__name__)


class GrabberStatus(IntEnum):
    """
    抢课工具状态。
    """

    IDLE = 0
    """
    空闲。
    """

    WAITING = 1
    """
    等待。
    """

    RUNNING = 2
    """
    正在工作。
    """


class Grabber:
    """
    抢课工具。
    """

    account: Account
    """
    用于执行抢课任务的帐户。
    """

    config: GrabberConfig
    """
    抢课工具配置。
    """

    _queue: list[Course]

    _task: asyncio.Task[None] | None
    """
    选课操作任务。
    """

    _running: bool
    """
    是否处于工作状态。
    """

    @property
    def queue(self) -> list[Course]:
        """
        抢课队列。
        """

        return self._queue.copy()

    @property
    def status(self) -> GrabberStatus:
        """
        状态。
        """

        if self._task is None:
            return GrabberStatus.IDLE

        return GrabberStatus.RUNNING if self._running else GrabberStatus.WAITING

    def __init__(
        self,
        account: Account,
        config: GrabberConfig,
        courses: Iterable[Course],
    ) -> None:
        """
        初始化 `Grabber`。

        Args:
            account (Account): 用于执行抢课任务的帐户。
            config (GrabberConfig): 抢课工具配置。
            courses (Iterable[Course]): 待抢课课程列表。
        """

        self.account = account

        self._queue = list(courses)
        self.config = config

        self._task = None

        self._running = False

    async def _wait_until_start(self) -> None:
        """
        等待至指定开始时间。
        """

        if not self.config.start_at:
            return

        now = datetime.now(timezone.utc)

        if now >= self.config.start_at:
            return

        delay = self.config.start_at - now
        await asyncio.sleep(delay.total_seconds())

    async def _select_courses(self) -> None:
        """
        执行选课操作。
        """

        async with EasClient(self.account) as client:
            for course in self._queue.copy():
                try:
                    await client.select_course(course)
                except AuthorizationFailed:
                    raise
                except Exception as ex:
                    logger.warning("grab course %s (%d) failed: %s", course.name, course.id, ex)

                    if not self.config.retry:
                        self._queue.remove(course)

                    continue
                finally:
                    await asyncio.sleep(self.config.delay.total_seconds())

                logger.info("grab course %s (%d) successfully.", course.name, course.id)
                self._queue.remove(course)

    async def _worker(self) -> None:
        """
        进行抢课操作的主循环。
        """

        await self._wait_until_start()

        self._running = True

        while self._queue:
            try:
                await self._select_courses()
            except AuthorizationFailed:
                logging.error("authorization failed, grabber task terminated.")
                return

        await self.cancel()

    async def start(self) -> bool:
        """
        在后台执行抢课操作主循环。

        Returns:
            bool: 如果成功创建抢课操作任务则返回 `True`；若创建失败或任务已存在则返回 `False`。
        """

        if self._task:
            return False

        self._task = asyncio.create_task(self._worker())
        return True

    async def cancel(self) -> bool:
        """
        取消抢课操作任务。

        Returns:
            bool: 如果成功取消抢课操作任务则返回 `True`；若取消失败或任务不存在则返回 `False`。
        """

        self._running = False

        if not self._task:
            return False

        cancelled = self._task.cancel()

        if cancelled:
            self._task = None

        return cancelled
