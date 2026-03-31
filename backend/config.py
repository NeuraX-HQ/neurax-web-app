"""
Application configuration — loads from environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # AWS
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2")
    DYNAMODB_TABLE_PREFIX: str = os.getenv("DYNAMODB_TABLE_PREFIX", "nutritrack")

    # Cognito
    COGNITO_USER_POOL_ID: str = os.getenv("COGNITO_USER_POOL_ID", "")
    COGNITO_APP_CLIENT_ID: str = os.getenv("COGNITO_APP_CLIENT_ID", "")
    COGNITO_REGION: str = os.getenv("COGNITO_REGION", AWS_REGION)


    # AI Service Team
    AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "https://nutritrack-api.fly.dev")
    AI_SERVICE_SECRET_KEY: str = os.getenv("AI_SERVICE_SECRET_KEY", "")

    # S3
    S3_UPLOADS_BUCKET: str = os.getenv("S3_UPLOADS_BUCKET", "nutritrack-uploads")

    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")

    # Table names (derived)
    @property
    def users_table(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}-users"

    @property
    def meals_table(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}-meals"

    @property
    def foods_table(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}-foods"

    @property
    def hydration_table(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}-hydration"


settings = Settings()
