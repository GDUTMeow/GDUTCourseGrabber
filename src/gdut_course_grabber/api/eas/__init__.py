"""
提供教务系统相关 API。
"""

from fastapi import APIRouter

from gdut_course_grabber.api.types import ApiResponse
from gdut_course_grabber.api.utils.account import AccountDep
from gdut_course_grabber.models import Course, Lesson
from gdut_course_grabber.utils.eas import EasClient

router = APIRouter()


@router.get("/courses")
async def get_courses(
    account: AccountDep, count: int = 10, page: int = 1
) -> ApiResponse[list[Course]]:
    """
    获取公选课课程列表路由。

    Args:
        account (AccountDep): 用于访问教务系统的帐户。
        count (int, optional): 数量。默认为 10。
        page (int, optional): 页面。默认为 1。

    Returns:
        ApiResponse[list[Course]]: 根据指定数量及页面返回相应范围的课程列表。
    """

    async with EasClient(account) as client:
        courses = await client.get_courses(count, page)

    return ApiResponse(data=courses)


@router.get("/courses/{id}/lessons")
async def get_lessons(account: AccountDep, id: int) -> ApiResponse[list[Lesson]]:
    """
    获取公选课的节次详情列表路由。

    Args:
        account (AccountDep): 用于访问教务系统的帐户。
        id (int): 课程 ID。

    Returns:
        ApiResponse[list[Lesson]]: 指定课程的节次详情列表。
    """

    async with EasClient(account) as client:
        lessons = await client.get_lessons(id)

    return ApiResponse(data=lessons)
