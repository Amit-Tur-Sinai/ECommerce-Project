"""
Feature flags and application configuration.

Toggle these flags to enable/disable features.
In POC/demo mode, demo data generation should be enabled.
"""

# =========================
# Feature Flags
# =========================

# When True, automatically generates demo sensor readings, recommendations,
# and compliance scores when a new business user registers.
# Set to True for POC/demo environments, False for production.
GENERATE_DEMO_DATA_ON_REGISTER = True

# When True, policy violation warning emails are actually sent via SMTP.
# When False (default), emails are simulated — logged to the database and console.
SEND_REAL_EMAILS = False

# =========================
# SMTP Configuration
# =========================
# Only used when SEND_REAL_EMAILS = True.
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER = ""
SMTP_PASSWORD = ""
SMTP_FROM = ""
