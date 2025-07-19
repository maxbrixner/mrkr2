# ---------------------------------------------------------------------------- #

import bcrypt

# ---------------------------------------------------------------------------- #


def hash_password(plain_password: str, encoding: str = "utf-8") -> str:
    """
    Salt and hash a password using bcrypt.
    """
    return bcrypt.hashpw(
        plain_password.encode(encoding=encoding),
        bcrypt.gensalt()
    ).decode(encoding=encoding)


# ---------------------------------------------------------------------------- #


def check_password(
    plain_password: str,
    hashed_password: str,
    encoding: str = "utf-8"
) -> bool:
    """
    Check a password using bcrypt.
    """
    return bcrypt.checkpw(
        plain_password.encode(encoding=encoding),
        hashed_password.encode(encoding=encoding)
    )

# ---------------------------------------------------------------------------- #
