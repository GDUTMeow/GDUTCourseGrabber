"""
提供教务系统 (EAS) 相关实用工具。
"""

import json as jsonlib
from typing import Any, Self

from httpx import AsyncClient, Response
from pydantic import TypeAdapter

from gdut_course_grabber.models import Account
from gdut_course_grabber.models import Course as CourseModel
from gdut_course_grabber.models import Lesson as LessonModel

from ._types import Course, Lesson

_BASE_URL = "https://jxfw.gdut.edu.cn/"

_BASE_HEADER = {
    "Host": "jxfw.gdut.edu.cn",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    ),
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Origin": _BASE_URL,
    "DNT": "1",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}


class AuthorizationFailed(Exception):
    """
    认证失败。
    """


class CourseSelectionFailed(Exception):
    """
    选课失败。
    """


class EasClient:
    """
    教务系统客户端。

    提供相关 API 访问及数据反序列化操作。
    """

    _client: AsyncClient

    def __init__(self, account: Account) -> None:
        """
        初始化 `EasClient`。

        Args:
            account (Account): 用于访问教务系统的帐户。
            base_url (str, optional): 教务系统 URL。默认为 `_DEFAULT_BASE_URL`.
        """

        cookies = {"JSESSIONID": account.session_id}
        self._client = AsyncClient(base_url=_BASE_URL, headers=_BASE_HEADER, cookies=cookies)

    async def aclose(self) -> None:
        """
        关闭所有传输。
        """

        await self._client.aclose()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_) -> None:
        await self.aclose()

    @staticmethod
    def _validate(resp: Response) -> bytes:
        """
        校验响应数据。

        Args:
            resp (Response): 待校验的响应。

        Returns:
            bytes: 响应数据。
        """

        resp.raise_for_status()
        data = resp.read()
        if data[:32].lstrip().startswith(b"<!DOCTYPE"):
            raise AuthorizationFailed
        return data

    async def select_course(self, course: CourseModel) -> None:
        """
        选课。

        Args:
            course (CourseModel): 所需选择的课程。
        """

        headers = {"Referer": str(self._client.base_url.join("/xskjcjxx!kjcjList.action"))}
        data = {"kcrwdm": str(course.id), "kcmc": course.name}
        resp = await self._client.post("/xsxklist!getAdd.action", headers=headers, data=data)

        ret = self._validate(resp).decode().strip()

        if ret not in ["1", "您已经选了该门课程"]:
            raise CourseSelectionFailed(ret)

    async def get_courses(self, count: int, page: int) -> list[CourseModel]:
        """
        获取公选课课程列表。

        Args:
            count (int): 数量。
            page (int): 页面。

        Returns:
            list[CourseModel]: 根据指定数量及页面返回相应范围的课程列表。
        """

        if page < 1 or count < 1:
            raise ValueError

        headers = {"Referer": str(self._client.base_url.join("xsxklist!xsmhxsxk.action"))}
        data: dict[str, Any] = {
            "sort": "kcrwdm",
            "order": "asc",
            "page": page,
            "rows": count,
        }
        resp = await self._client.post("/xsxklist!getDataList.action", headers=headers, data=data)

        json = jsonlib.loads(self._validate(resp))
        return list(
            map(
                CourseModel.model_validate,
                TypeAdapter(list[Course]).validate_python(json["rows"]),
            )
        )

    async def get_lessons(self, course_id: int) -> list[LessonModel]:
        """
        获取公选课的节次详情列表。

        Args:
            course_id (int): 课程 ID。

        Returns:
            list[LessonModel]: 指定课程的节次详情列表。
        """

        headers = {
            "Referer": str(
                self._client.base_url.join(f"/xsxklist!viewJxrl.action?kcrwdm={course_id}")
            )
        }
        resp = await self._client.get(
            f"/xsxklist!getJxrlDataList.action?kcrwdm={course_id}", headers=headers
        )

        json = jsonlib.loads(self._validate(resp))
        return list(
            map(
                LessonModel.model_validate,
                TypeAdapter(list[Lesson]).validate_python(json),
            )
        )
