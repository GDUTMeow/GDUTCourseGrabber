"""
提供存储相关 API。
"""

from fastapi import APIRouter, Request

from gdut_course_grabber.api.exc import entity_not_found_error
from gdut_course_grabber.api.types import ApiResponse
from gdut_course_grabber.context.storage import storage_manager

router = APIRouter()


@router.get("/{key}")
def get(key: str) -> ApiResponse[bytes]:
    """
    获取指定键相应存储数据。

    Args:
        key (str): 所需获取存储数据的键。
    """

    try:
        value = storage_manager.get(key)
    except KeyError as ex:
        raise entity_not_found_error(key) from ex

    return ApiResponse(data=value)


@router.put("/{key}")
async def set(request: Request, key: str) -> ApiResponse[None]:
    """
    向指定键存储数据。

    Args:
        key (str): 用于存储数据的键。
    """

    body = await request.body()
    storage_manager.set(key, body)

    return ApiResponse(data=None)
