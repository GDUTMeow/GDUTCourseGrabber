"""
提供数据类型。
"""

from datetime import datetime, timedelta, timezone
from enum import IntEnum

from pydantic import BaseModel, field_validator


class CourseSource(IntEnum):
    """
    课程来源。
    """

    EAS = 0
    """
    教务系统。
    """

    CUSTOM = 1
    """
    自定义。
    """


class Course(BaseModel):
    """
    课程。
    """

    id: int
    """
    课程 ID。
    """

    name: str
    """
    课程名称。
    """

    teacher: str
    """
    授课老师。
    """

    category: str
    """
    课程分类。
    """

    chosen: int
    """
    已选课人数。
    """

    limit: int
    """
    人数上限
    """

    source: CourseSource
    """
    课程来源。
    """

    note: str = ""
    """
    备注。
    """


class Lesson(BaseModel):
    """
    课程节次详情。
    """

    name: str
    """
    课程名称。
    """

    term: str
    """
    授课学期。
    """

    week: int
    """
    授课周次。
    """

    day: int
    """
    授课星期数。
    """

    content_type: str
    """
    授课内容类型 (教学环节)。
    """

    location_type: str
    """
    授课地点类型。
    """

    location: str
    """
    授课地点。
    """

    teachers: list[str]
    """
    授课老师。
    """

    sessions: list[int]
    """
    节次。
    """


class Account(BaseModel):
    """
    帐户。
    """

    session_id: str
    """
    会话 ID。
    """


class GrabberConfig(BaseModel):
    """
    抢课工具配置。
    """

    delay: timedelta = timedelta(seconds=0.5)
    """
    抢课任务间延迟时间。
    """

    start_at: datetime | None = None
    """
    抢课任务开始时间 (UTC)。
    """

    retry: bool = True
    """
    是否在抢课失败后自动重试。
    """

    @field_validator("start_at", mode="after")
    @classmethod
    def convert_start_at_to_utc(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None

        return value.astimezone(timezone.utc)


class GrabberTask(BaseModel):
    """
    抢课任务。
    """

    account: Account
    """
    用于执行抢课操作的帐户。
    """

    config: GrabberConfig = GrabberConfig()
    """
    抢课工具配置。
    """

    courses: list[Course] = []
    """
    待抢课课程列表。
    """
