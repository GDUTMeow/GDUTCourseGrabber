"""
提供教务系统相关 API。
"""

from fastapi import APIRouter

from gdut_course_grabber.api.types import ApiResponse
from gdut_course_grabber.context.config import load_config
from gdut_course_grabber.models import Course, Lesson
from gdut_course_grabber.utils.eas import EasClient

router = APIRouter()


@router.get("/courses")
async def get_courses(count: int = 10, page: int = 1) -> ApiResponse[list[Course]]:
    """
    获取公选课课程列表路由。

    Args:
        count (int, optional): 数量。默认为 10。
        page (int, optional): 页面。默认为 1。

    Returns:
        ApiResponse[list[Course]]: 根据指定数量及页面返回相应范围的课程列表。
    """

    config = load_config()

    async with EasClient(config.account) as client:
        courses = await client.get_courses(count, page)

    return ApiResponse(data=courses)


@router.get("/courses/{id}/lessons")
async def get_lessons(id: int) -> ApiResponse[list[Lesson]]:
    """
    获取公选课的节次详情列表路由。

    Args:
        id (int): 课程 ID。

    Returns:
        ApiResponse[list[Lesson]]: 指定课程的节次详情列表。
    """

    config = load_config()

    async with EasClient(config.account) as client:
        lessons = await client.get_lessons(id)

    return ApiResponse(data=lessons)