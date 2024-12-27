"""
提供抢课工具相关 API。
"""

from fastapi import APIRouter

from gdut_course_grabber.api.exc import entity_not_found_error
from gdut_course_grabber.api.types import ApiResponse, KeyValuePair
from gdut_course_grabber.context.grabber import grabber_task_manager
from gdut_course_grabber.models import GrabberTask
from gdut_course_grabber.utils.grabber import GrabberEntry

router = APIRouter()


def _get_grabber_entry(id: int) -> GrabberEntry:
    """
    获取抢课工具条目。

    Args:
        id (int): 抢课任务 ID。

    Returns:
        GrabberEntry: 指定 ID 的抢课工具条目。
    """

    try:
        return grabber_task_manager.grabbers[id]
    except KeyError as ex:
        raise entity_not_found_error(id) from ex


@router.get("/")
def get_tasks() -> ApiResponse[list[KeyValuePair[int, GrabberTask]]]:
    """
    获取抢课任务列表路由。

    Returns:
        ApiResponse[list[KeyValuePair[int, GrabberTask]]]: 抢课任务列表。
    """

    tasks = [
        KeyValuePair(key=key, value=value.task)
        for key, value in grabber_task_manager.grabbers.items()
    ]

    return ApiResponse(data=tasks)


@router.post("/")
def add_task(task: GrabberTask) -> ApiResponse[None]:
    """
    添加抢课任务路由。

    Args:
        task (GrabberTask): 待添加的抢课任务。
    """

    grabber_task_manager.add_task(task)
    return ApiResponse(data=None)


@router.delete("/{id}")
def destroy_task(id: int) -> ApiResponse[None]:
    """
    销毁抢课任务路由。

    Args:
        id (int): 抢课任务 ID。
    """

    try:
        grabber_task_manager.destroy_task(id)
    except KeyError as ex:
        raise entity_not_found_error(id) from ex

    return ApiResponse(data=None)


@router.get("/{id}")
def get_task(id: int) -> ApiResponse[GrabberTask]:
    """
    获取抢课任务路由。

    Args:
        id (int): 抢课任务 ID。

    Returns:
        ApiResponse[GrabberTask]: 指定 ID 的抢课任务信息。
    """

    entry = _get_grabber_entry(id)
    return ApiResponse(data=entry.task)


@router.get("/{id}/reset")
def reset_task(id: int) -> ApiResponse[None]:
    """
    重置抢课任务路由。

    Args:
        id (int): 抢课任务 ID。
    """

    try:
        grabber_task_manager.reset_task(id)
    except KeyError as ex:
        raise entity_not_found_error(id) from ex

    return ApiResponse(data=None)


@router.get("/{id}/start")
async def start_task(id: int) -> ApiResponse[bool]:
    """
    启动抢课任务路由。

    Args:
        id (int): 抢课任务 ID。

    Returns:
        ApiResponse[bool]: 是否成功启动。
    """

    entry = _get_grabber_entry(id)
    started = await entry.conductor.start()
    return ApiResponse(data=started)


@router.get("/{id}/cancel")
async def cancel_task(id: int) -> ApiResponse[bool]:
    """
    取消抢课任务路由。

    Args:
        id (int): 抢课任务 ID。

    Returns:
        ApiResponse[bool]: 是否成功取消。
    """

    entry = _get_grabber_entry(id)
    cancelled = await entry.conductor.cancel()
    return ApiResponse(data=cancelled)
