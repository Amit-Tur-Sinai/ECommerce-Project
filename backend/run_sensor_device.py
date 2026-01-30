#!/usr/bin/env python3
"""
Wrapper script to run the demo sensor device.

This script ensures the app module can be found by adding the project root to PYTHONPATH.
"""

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Now import and run the main function
from app.demo_sensor_device import main

if __name__ == "__main__":
    main()
