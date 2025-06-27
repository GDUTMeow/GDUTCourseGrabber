"""
提供帐户相关实用工具。
"""

from typing import Annotated

from fastapi import Depends

from gdut_course_grabber.models import Account

__all__ = ["AccountDep"]


def _account_parameters(session_id: str) -> Account:
    """
    解析参数为帐户。

    Args:
        session_id (str): 会话 ID。

    Returns:
        Account: 解析结果。
    """

    return Account(session_id=session_id)


AccountDep = Annotated[Account, Depends(_account_parameters)]
