from typing import Annotated

from fastapi import Depends

from gdut_course_grabber.models import Account


__all__ = ["AccountDep"]


def account_parameters(session_id: str) -> Account:
    return Account(session_id=session_id)


AccountDep = Annotated[Account, Depends(account_parameters)]
