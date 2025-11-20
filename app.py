from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from supabase import create_client, Client
from datetime import datetime
import traceback
import sys


# ---------------- Supabase Setup ----------------
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)


# ---------------- FastAPI Setup ----------------
app = FastAPI()


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Pydantic Model ----------------
class Catch(BaseModel):
    date: str
    time: str
    location: str
    species: str
    length_in: float
    weight_lbs: float
    temperature: float
    bait: str




# ---------------- API Endpoints ----------------
@app.post("/log-catch")
def logCatch(catch: Catch):
    """
    Logs a new catch to the Supabase database.
    If date or time is missing, defaults to current date and time.
    """
    try:
        # Set defaults if missing
        if not catch.date:
            catch.date = datetime.today().date().isoformat()
        if not catch.time:
            catch.time = datetime.now().strftime("%H:%M")


        # Insert catch into Supabase
        response = supabase.table("catches").insert([catch.dict()]).execute()
        return {"success": True, "data": response.data}


    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))




@app.get("/catches")
def getCatches():
    """
    Retrieves all catches from the Supabase database, ordered by ID ascending.
    """
    try:
        response = supabase.table("catches").select("*").order("id", desc=False).execute()
        return {"data": response.data}
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))




@app.delete("/delete-catch/{catchId}")
def deleteCatch(catchId: int):
    """
    Deletes a catch from the database by its ID.
    Returns success status and message.
    """
    try:
        response = supabase.table("catches").delete().eq("id", catchId).execute()


        if not response.data:
            # No data returned means catch was not found
            return {"success": False, "message": "Catch not found"}


        return {"success": True, "message": "Catch deleted successfully"}


    except Exception as error:
        # Log detailed traceback to backend console
        print("ERROR in deleteCatch:", error, file=sys.stderr)
        traceback.print_exc()
        # Send a simpler error message to frontend
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(error)}")




@app.put("/edit-catch/{catchId}")
async def editCatch(catchId: int, catch: Catch):
    """
    Updates an existing catch by its ID.
    Does not allow updating the ID field itself.
    """
    try:
        response = (
            supabase.table("catches")
            .update(catch.dict(exclude={"id"}))  # Prevent updating the ID
            .eq("id", catchId)
            .execute()
        )


        return {"success": True, "data": response.data}


    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

