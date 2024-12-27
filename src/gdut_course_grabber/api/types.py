"""
提供用于 API 返回的类型。
"""

from enum import StrEnum, auto
from typing import Any, Sequence

from pydantic import BaseModel


class ErrorKind(StrEnum):
    """
    错误类型。
    """

    UNEXPECTED = auto()
    """
    非预期错误。
    """

    VALIDATION = auto()
    """
    校验错误。
    """

    ENTITY_NOT_FOUND = auto()
    """
    未找到指定实体。
    """


class ApiResponse[T](BaseModel):
    """
    API 响应。
    """

    error: ErrorKind | None = None
    """
    错误，若成功则为 `None`。
    """

    message: str = ""
    """
    消息。
    """

    data: T
    """
    响应数据。
    """


class ValidationError(BaseModel):
    """
    校验错误。
    """

    body: Any
    """
    请求体。
    """

    errors: Sequence[Any]
    """
    错误。
    """


class EntityNotFound[T](BaseModel):
    """
    未找到指定实体。
    """

    request: T
    """
    请求内容。
    """


class KeyValuePair[K, V](BaseModel):
    """
    键值对。
    """

    key: K
    """
    键。
    """

    value: V
    """
    值。
    """
