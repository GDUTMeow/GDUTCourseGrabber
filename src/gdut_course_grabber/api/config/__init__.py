"""
提供配置相关路由。
"""

from fastapi import APIRouter

from gdut_course_grabber.api.types import ApiResponse
from gdut_course_grabber.context.config import load_config, update_config
from gdut_course_grabber.models import Config

router = APIRouter()


@router.get("/")
def get() -> ApiResponse[Config]:
    """
    获取配置路由。

    Returns:
        ApiResponse[Config]: 当前配置。
    """

    config = load_config()
    return ApiResponse(data=config)


@router.put("/")
def update(config: Config) -> ApiResponse[Config]:
    """
    更新配置路由。

    Args:
        config (Config): 将要更新为的配置。

    Returns:
        ApiResponse[Config]: 更新后的配置。
    """

    update_config(config)
    return ApiResponse(data=config)
