# ---------------------------------------------------------------------------- #

import sqlmodel

# ---------------------------------------------------------------------------- #

import app.crud as crud
import app.schemas as schemas
import app.models as models
from test._testcase import TestCase

# ---------------------------------------------------------------------------- #


class UserCrudTest(TestCase):
    """
    Test cases for CRUD operations in the API.
    """

    def test_create_user(self) -> None:
        """
        Test case for creating a new user.
        """
        result = crud.create_user(
            session=self.session,
            user=schemas.UserCreateSchema(
                username="testuser",
                email="test@example.com",
                password="testpassword"
            )
        )
        assert isinstance(result, models.User)

        user = self.session.exec(sqlmodel.select(models.User)).first()

        assert user is not None
        assert isinstance(user, models.User)
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.password == "testpassword"
        assert user.disabled == False


# ---------------------------------------------------------------------------- #
