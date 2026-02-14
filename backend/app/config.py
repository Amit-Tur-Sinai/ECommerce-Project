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
