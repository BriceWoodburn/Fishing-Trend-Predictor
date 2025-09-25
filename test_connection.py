from supabase import create_client, Client
from datetime import datetime

url = "https://fczfpqfwcxfhyakgggbf.supabase.co"
key = "sb_secret_7X0ghBjHEJeyBBeSN_yFRQ_CIgwBtvu"
supabase: Client = create_client(url, key)

data = {"date": datetime.today().isoformat(),"time": datetime.now().strftime("%H:%M:%S") ,"location": "Loch Raven", "species": "Bluegill","length_in": 4.75, "weight_lbs": 1.02, "weather": "sunny", "bait": "worm" }
supabase.table("catches").insert(data).execute()
print("succsess! you imported data!")