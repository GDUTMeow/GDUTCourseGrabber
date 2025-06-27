"""
提供 API 接口。
"""

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from gdut_course_grabber.api.exc import ApiException, unexpected_error, validation_error

from . import eas, grabber, storage

app = FastAPI()
"""
API 接口应用。
"""

app.include_router(eas.router, prefix="/eas")
app.include_router(grabber.router, prefix="/grabber")
app.include_router(storage.router, prefix="/storage")


@app.exception_handler(ApiException)
async def api_exception_handler[T](_: Request, exc: ApiException[T]) -> JSONResponse:
    """
    处理 API 异常。
    """

    return JSONResponse(jsonable_encoder(exc.inner), exc.status_code)


@app.exception_handler(Exception)
async def global_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """
    处理全局异常。
    """

    exception = unexpected_error(exc)
    return JSONResponse(jsonable_encoder(exception.inner), exception.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """
    处理校验错误。
    """

    exception = validation_error(exc)
    return JSONResponse(jsonable_encoder(exception.inner), exception.status_code)
