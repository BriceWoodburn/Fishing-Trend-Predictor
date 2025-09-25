import mysql.connector
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from supabase import create_client, Client

print("✅ All libraries installed successfully!")

# to launch the virtual environment -> venv\Scripts\activate
# to get into the correct pyton interpreter -> Ctrl+Shift+P then select Python: Select Interpreter
# to launch fastapi server -> uvicorn app:app --reload
