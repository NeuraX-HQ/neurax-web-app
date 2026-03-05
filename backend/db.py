"""
DynamoDB client and table helpers.
"""
import boto3
from config import settings

_dynamodb = None


def get_dynamodb():
    """Get or create a DynamoDB resource (singleton)."""
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb", region_name=settings.AWS_REGION)
    return _dynamodb


def get_table(table_name: str):
    """Get a DynamoDB Table resource."""
    return get_dynamodb().Table(table_name)


# Convenience accessors
def users_table():
    return get_table(settings.users_table)


def meals_table():
    return get_table(settings.meals_table)


def foods_table():
    return get_table(settings.foods_table)


def hydration_table():
    return get_table(settings.hydration_table)
