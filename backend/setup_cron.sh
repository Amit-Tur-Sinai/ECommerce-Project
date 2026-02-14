#!/bin/bash
# ==============================================================
# Canopy - Daily Cron Job Setup
# ==============================================================
# This script installs cron jobs for:
#   1. Daily model training (2:00 AM)
#   2. Daily weather data ingestion (3:00 AM)
#   3. Daily sensor data generation (4:00 AM)
#
# Usage:
#   cd backend
#   chmod +x setup_cron.sh
#   ./setup_cron.sh
#
# To remove all Canopy cron jobs:
#   ./setup_cron.sh --remove
# ==============================================================

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_PATH="$(which python3 || which python)"
LOG_DIR="$SCRIPT_DIR/logs"

echo "============================================"
echo "  Canopy Cron Job Setup"
echo "============================================"
echo "Backend dir:  $SCRIPT_DIR"
echo "Python:       $PYTHON_PATH"
echo "Log dir:      $LOG_DIR"
echo ""

# Handle --remove flag
if [ "$1" = "--remove" ]; then
    echo "Removing all Canopy cron jobs..."
    crontab -l 2>/dev/null | grep -v "# canopy-scheduled-task" | crontab -
    echo "Done. All Canopy cron jobs removed."
    exit 0
fi

# Create logs directory
mkdir -p "$LOG_DIR"

# Build cron entries
# Each line is tagged with "# canopy-scheduled-task" for easy identification/removal
CRON_JOBS=$(cat <<EOF
# --- Canopy Scheduled Tasks ---
# Daily model training at 2:00 AM
0 2 * * * cd $SCRIPT_DIR && $PYTHON_PATH app/schedule_tasks.py train >> $LOG_DIR/train.log 2>&1 # canopy-scheduled-task
# Daily weather data ingestion at 3:00 AM
0 3 * * * cd $SCRIPT_DIR && $PYTHON_PATH app/schedule_tasks.py ingest >> $LOG_DIR/ingest.log 2>&1 # canopy-scheduled-task
# Daily sensor data generation at 4:00 AM
0 4 * * * cd $SCRIPT_DIR && $PYTHON_PATH app/schedule_tasks.py generate_sensors >> $LOG_DIR/sensors.log 2>&1 # canopy-scheduled-task
EOF
)

# Remove any existing Canopy cron jobs, then append the new ones
(crontab -l 2>/dev/null | grep -v "# canopy-scheduled-task" | grep -v "# --- Canopy Scheduled Tasks ---"; echo "$CRON_JOBS") | crontab -

echo "Cron jobs installed successfully!"
echo ""
echo "Schedule:"
echo "  02:00 AM - Train ML models        (logs: $LOG_DIR/train.log)"
echo "  03:00 AM - Ingest weather data     (logs: $LOG_DIR/ingest.log)"
echo "  04:00 AM - Generate sensor data    (logs: $LOG_DIR/sensors.log)"
echo ""
echo "To verify:  crontab -l"
echo "To remove:  ./setup_cron.sh --remove"
echo "To view logs: tail -f $LOG_DIR/train.log"
