# ---------------------------------------------------------------------------- #

import pydantic

# ---------------------------------------------------------------------------- #


class UserCreateSchema(pydantic.BaseModel):
    """
    Schema for creating a new user.
    """
    username: str = pydantic.Field(
        ..., min_length=3, max_length=50,
        description="Username must be between 3 and 50 characters.",
        examples=["john.doe"])
    email: pydantic.EmailStr = pydantic.Field(
        ...,
        description="A valid email address.",
        examples=["john.doe@example.com"])
    password: str = pydantic.Field(
        ..., min_length=8, max_length=128,
        description="Password must be at least 8 characters long.",
        examples=["securepassword123"])


# ---------------------------------------------------------------------------- #


class UserListSchema(pydantic.BaseModel):
    """
    Schema for listing users.
    """
    id: int = pydantic.Field(
        ...,
        description="Unique identifier for the user.",
        examples=[1]
    )
    username: str = pydantic.Field(
        ...,
        description="Username of the user.",
        examples=["john.doe"]
    )
    email: str = pydantic.Field(
        ...,
        description="Email address of the user.",
        examples=["john.doe@example.com"]
    )
    disabled: bool = pydantic.Field(
        ...,
        description="Indicates if the user account is disabled.",
        examples=[False]
    )

# ---------------------------------------------------------------------------- #
