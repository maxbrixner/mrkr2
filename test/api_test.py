# ---------------------------------------------------------------------------- #

import fastapi

# ---------------------------------------------------------------------------- #

from test._testcase import TestCase

# ---------------------------------------------------------------------------- #


class TestV1API(TestCase):
    """
    Test cases for the v1 API endpoints.
    """
    @classmethod
    def setUpClass(cls) -> None:
        """
        This runs once before all tests to set up the API version for
        all tests in this class.
        """
        super().setUpClass()
        cls.api_version = "/api/v1"

    def test_health(self) -> None:
        """
        Test the health endpoint to ensure the API is running and healthy.
        """
        response = self.client.get(
            f"{self.api_version}/utils/health")

        assert response.status_code == 200
        assert response.json()["health"] == "healthy"

    def test_user_login(self) -> None:
        """
        Test the user login endpoint to ensure it returns a 500 status code,
        as the login functionality is not yet implemented.
        """
        response = self.client.post(
            f"{self.api_version}/user/login")

        assert response.status_code == \
            fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_user_create(self) -> None:
        """
        Test the user creation endpoint to ensure a user can be created
        successfully.
        """
        response = self.client.post(
            f"{self.api_version}/user/create",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpassword"
            }
        )

        assert response.status_code == 200
        assert "message" in response.json()

# ---------------------------------------------------------------------------- #
