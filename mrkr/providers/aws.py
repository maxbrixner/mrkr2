# ---------------------------------------------------------------------------- #

import boto3
import re
import os
import logging
import pydantic
import datetime
import asyncio
import functools
from typing import Any

# ---------------------------------------------------------------------------- #

import mrkr.schemas as schemas

# ---------------------------------------------------------------------------- #

logger = logging.getLogger("mrkr.providers")

# ---------------------------------------------------------------------------- #


class _AwsTemporaryCredentials(pydantic.BaseModel):
    AccessKeyId: str
    SecretAccessKey: str
    SessionToken: str
    Expiration: datetime.datetime

# ---------------------------------------------------------------------------- #


class AwsSession(boto3.session.Session):
    """
    Inherits the boto3 session to automatically handle role changes and
    temporary credentials.
    """
    _config: schemas.AwsConfigSchema
    _temp_credentials: _AwsTemporaryCredentials | None

    def __init__(self, config: schemas.AwsConfigSchema) -> None:
        """
        Initialize the AWS session.
        """
        self._config = config

        super().__init__(
            aws_access_key_id=self._config_aws_access_key_id,
            aws_secret_access_key=self._config_aws_secret_access_key,
            region_name=self._config_aws_region_name
        )

        self._temp_credentials = None

        logger.debug(f"AWS session initialized")

    @property
    def _config_aws_access_key_id(self) -> str:
        return self.resolve_config(self._config.aws_access_key_id)

    @property
    def _config_aws_secret_access_key(self) -> str:
        return self.resolve_config(self._config.aws_secret_access_key)

    @property
    def _config_aws_region_name(self) -> str:
        return self.resolve_config(self._config.aws_region_name)

    @property
    def _config_aws_account_id(self) -> str:
        return self.resolve_config(self._config.aws_account_id)

    @property
    def _config_aws_role_name(self) -> str:
        return self.resolve_config(self._config.aws_role_name)

    def resolve_config(self, string: str) -> str:
        """
        Replace any environment variable placeholders in a string with their
        values. If an environment variable is not set, raise an exception.
        Placeholders are in the format {{VAR_NAME}} where VAR_NAME is the name
        of the environment variable to be replaced.
        """
        def replace_env_var(match: re.Match) -> str:
            """
            Replace environment variable placeholders in the URL.
            """
            name = match.group(1)
            value = os.getenv(name, default=None)
            if value is None:
                raise Exception(f"Environment variable '{name}' not set.")
            return value

        string = re.sub(r"{{(\w+)}}", replace_env_var, string)
        return string

    async def refresh_temp_credentials(self) -> None:
        """
        Fetch and update temporary credentials.
        """
        if self._temp_credentials is not None:
            if self._temp_credentials.Expiration <= \
                    datetime.datetime.now(tz=datetime.timezone.utc):
                logger.debug("Temporary credentials sill valid.")
                return

        logger.debug("Fetching temporary AWS credentials...")

        loop = asyncio.get_running_loop()

        client = await loop.run_in_executor(
            None,
            functools.partial(
                super().client,
                service_name="sts"
            )
        )

        role_arn = f"arn:aws:iam::{self._config_aws_account_id}" \
            f":role/{self._config_aws_role_name}"

        response = await loop.run_in_executor(
            None,
            functools.partial(
                client.assume_role,
                RoleSessionName='MrkrSession',
                RoleArn=role_arn
            )
        )

        self._temp_credentials = \
            _AwsTemporaryCredentials(**response['Credentials'])

        logger.debug(
            f"Temporary AWS credentials received (expires "
            f"{self._temp_credentials .Expiration.strftime(
                '%Y-%m-%d %H:%M:%S%Z')})."
        )

    async def get_client(self, service_name: str) -> Any:
        """
        Return an AWS client for a specific service (e.g. s3, ec2) using
        the temporary credentials.
        """
        logger.debug(f"Creating AWS client using temporary "
                     f"credentials: {service_name}.")

        await self.refresh_temp_credentials()
        if not self._temp_credentials:
            raise Exception("Temporary credentials not available.")

        loop = asyncio.get_running_loop()

        return await loop.run_in_executor(
            None,
            functools.partial(
                super().client,
                service_name=service_name,
                region_name=self._config_aws_region_name,
                aws_access_key_id=self._temp_credentials.AccessKeyId,
                aws_secret_access_key=self._temp_credentials.SecretAccessKey,
                aws_session_token=self._temp_credentials.SessionToken
            )
        )

    async def get_resource(self, service_name: str) -> Any:
        """
        Return an AWS resource for a specific service (e.g. "s3", "ec2") using
        the temporary credentials.
        """
        logger.debug(f"Creating AWS resource using temporary "
                     f"credentials: {service_name}.")

        await self.refresh_temp_credentials()
        if not self._temp_credentials:
            raise Exception("Temporary credentials not available.")

        loop = asyncio.get_running_loop()

        return await loop.run_in_executor(
            None,
            functools.partial(
                super().resource,
                service_name=service_name,
                region_name=self._config_aws_region_name,
                aws_access_key_id=self._temp_credentials.AccessKeyId,
                aws_secret_access_key=self._temp_credentials.SecretAccessKey,
                aws_session_token=self._temp_credentials.SessionToken
            )
        )

    async def get_bucket(self, bucket_name: str) -> Any:
        """
        Return an AWS S3 bucket resource.
        """
        bucket_name = self.resolve_config(bucket_name)

        resource = await self.get_resource(service_name="s3")
        return resource.Bucket(name=bucket_name)

    async def get_textract_client(self) -> Any:
        """
        Return an AWS Textract client.
        """
        return await self.get_client(service_name="textract")

# ---------------------------------------------------------------------------- #
