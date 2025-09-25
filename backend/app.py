from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime
from typing import Optional

# ---------------- Supabase Setup ----------------
url = "https://fczfpqfwcxfhyakgggbf.supabase.co"
key = "sb_secret_7X0ghBjHEJeyBBeSN_yFRQ_CIgwBtvu"
supabase: Client = create_client(url, key)

# ---------------- FastAPI Setup ----------------
app = FastAPI()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace "*" with your frontend URL for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Pydantic Model ----------------
class Catch(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    location: str
    species: str
    length_in: float
    weight_lbs: float
    weather: Optional[str] = None
    bait: str = None

# ---------------- Routes ----------------
@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.post("/log-catch")
def log_catch(catch: Catch):
    try:
        # Set default date/time if missing
        if not catch.date:
            catch.date = datetime.today().date().isoformat()
        if not catch.time:
            catch.time = datetime.now().time().isoformat(timespec="seconds")

        # Insert into Supabase
        response = supabase.table("catches").insert([catch.dict()]).execute()
        return {"success": True, "data": response.data}

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

@app.get("/catches")
def get_catches():
    try:
        response = supabase.table("catches").select("*").execute()
        return {"data": response.data}
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    
@app.delete("/delete-catch/{catch_id}")
def delete_catch(catch_id: int):
    try:
        response = supabase.table("catches").delete().eq("id", catch_id).execute()

        # The modern client returns an object with .data and .error
        if response.error:
            raise HTTPException(status_code=400, detail=str(response.error))

        if not response.data or len(response.data) == 0:
            return {"success": False, "message": "Catch not found"}

        return {"success": True, "message": "Catch deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))