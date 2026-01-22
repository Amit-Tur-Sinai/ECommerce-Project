# Weather Prediction Data Pipeline

This module manages the data engineering and machine learning lifecycle for the Weather Prediction feature. It handles database initialization, model training (XGBoost), and daily data ingestion.

## 📂 Project Structure

This folder should be placed in the backend root.

```text
app/
├── db_setup.py           # 1. Bootstraps the DB with historical CSV data
├── train_model.py        # 2. Trains XGBoost models & saves .joblib artifacts
├── daily_ingest.py       # 3. Fetches yesterday's data, calculates features, inserts to DB
├── models/               # (Auto-generated) Stores the trained model files

🚀 Local Developer Setup
1. Prerequisites
Python 3.9+

PostgreSQL installed locally

The final_processed_weather_data.csv file must be present in the root.

2. Install Dependencies
Bash

pip install -r requirements.txt
3. Environment Variables (.env)
Create a .env file in the project root to configure your database connection. Note: This file is git-ignored. Do not commit it.

Ini, TOML

# .env content
DB_USER=postgres
DB_PASSWORD=your_local_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_app

# Path to the seed data file
CSV_PATH=final_processed_weather_data.csv
4. Initialize the Database
Run this script once to create the table and load the historical data from the CSV.

Bash

python app/db_setup.py
Output: ✅ Database ready.

5. Generate Models
Run this script to train the models. It reads from the DB and creates 4 artifacts in app/models/:

has_cold.joblib

has_fog.joblib

has_storm.joblib

has_heat.joblib

Bash

python app/train_model.py
☁️ Production Deployment Guide
1. Database Setup
Provision a PostgreSQL database (RDS, Supabase, Neon).

Add the Environment Variables (DB_USER, DB_HOST, etc.) to the cloud provider's dashboard.

2. Bootstrapping
On the first deployment, the database will be empty. You must run the setup script via the server's console or build command:

Bash

python app/db_setup.py
This requires final_processed_weather_data.csv to be present in the repository.

3. Model Serving
The backend API should load the models using joblib.

Python

import joblib
import pandas as pd

# Example Loading Logic
models = {
    "cold": joblib.load("app/models/has_cold.joblib"),
    "fog":  joblib.load("app/models/has_fog.joblib"),
    "storm": joblib.load("app/models/has_storm.joblib")
}

def predict(features: dict):
    # Ensure features match the order in models[key]['features']
    # Return probabilities...
4. Daily Updates (Cron Job)
To keep the model up-to-date, schedule daily_ingest.py to run once every 24 hours (e.g., at 02:00 UTC).

It fetches yesterday's actuals from OpenMeteo.

It calculates rolling features based on DB history.

It inserts the new row into the DB.

Bash

python app/daily_ingest.py
```
