"""
提供异常类型及响应异常构造实用函数。
"""

from fastapi.exceptions import RequestValidationError

from gdut_course_grabber.api.types import (
    ApiResponse,
    EntityNotFound,
    ErrorKind,
    ValidationError,
)


class ApiException[T](Exception):
    """
    API 异常。
    """

    inner: ApiResponse[T]
    """
    响应内容。
    """

    status_code: int
    """
    状态码。
    """

    def __init__(self, inner: ApiResponse[T], status_code: int) -> None:
        """
        初始化 `ApiException`。

        Args:
            inner (ApiResponse[T]): 响应内容。
            status_code (int): 状态码。
        """

        self.inner = inner
        self.status_code = status_code


def unexpected_error(exc: Exception) -> ApiException[None]:
    """
    非预期错误。

    Args:
        exc (Exception): 异常。

    Returns:
        ApiException[None]: 含有异常消息的 API 异常。
    """

    message = getattr(exc, "message", None) or str(exc)
    message = f"{type(exc).__qualname__}: {message}"
    response = ApiResponse(error=ErrorKind.UNEXPECTED, message=message, data=None)
    return ApiException(response, 500)


def validation_error(exc: RequestValidationError) -> ApiException[ValidationError]:
    """
    校验错误。

    Args:
        exc (RequestValidationError): FastAPI 请求体校验错误。

    Returns:
        ApiException[ValidationError]: 含有校验错误信息的 API 异常。
    """

    error = ValidationError(body=exc.body, errors=exc.errors())
    response = ApiResponse(error=ErrorKind.VALIDATION, message="validation failed.", data=error)
    return ApiException(response, 400)


def entity_not_found_error[T](request: T) -> ApiException[EntityNotFound[T]]:
    """
    未找到指定实体。

    Args:
        request (T): 请求内容。

    Returns:
        ApiException[EntityNotFound[T]]: 含有请求内容信息的 API 异常。
    """

    message = f"entity `{request}` not found."
    error = EntityNotFound(request=request)
    response = ApiResponse(error=ErrorKind.ENTITY_NOT_FOUND, message=message, data=error)
    return ApiException(response, 404)
