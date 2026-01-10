import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

url: Optional[str] = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: Optional[str] = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

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
    missing = []
    if not url:
        missing.append("NEXT_PUBLIC_SUPABASE_URL")
    if not key:
        missing.append("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    print(f"Warning: {', '.join(missing)} not found in environment variables.")
