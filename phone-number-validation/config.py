import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'db'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'example_password'),
    'database': os.getenv('DB_NAME', 'otp_service')
}
