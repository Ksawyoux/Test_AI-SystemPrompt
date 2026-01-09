import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

url: Optional[str] = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: Optional[str] = os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = None

if url and key:
    try:
        from supabase import create_client, Client
        supabase: Optional[Client] = create_client(url, key)
    except ImportError:
        print("Warning: supabase package not installed. Run: pip install supabase")
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase: {e}")
else:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")
