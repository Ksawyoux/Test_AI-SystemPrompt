"""
D-ID API Service
Creates realistic talking avatar videos using D-ID's Clips API
"""

import os
import base64
import asyncio
import httpx
from typing import Optional

DID_API_URL = "https://api.d-id.com"

# Default presenter - Sophia (female presenter)
# You can change this to any D-ID presenter ID
# Common options: "v2_public_sohpia@CtvJYUo9MA", "v2_public_sam@d0RA4vy-JN"
# Get full list: GET https://api.d-id.com/clips/presenters
DEFAULT_PRESENTER_ID = os.getenv("DID_PRESENTER_ID", "v2_public_sohpia@CtvJYUo9MA")


def get_did_headers():
    """Get D-ID API request headers."""
    api_key = os.getenv("DID_API_KEY")
    if not api_key:
        raise ValueError("DID_API_KEY not configured")
    
    # D-ID expects Basic Auth with the API key as username and empty password
    # If the key contains a colon, assume it's already in user:password format
    if ":" not in api_key:
        credentials = f"{api_key}:"
    else:
        credentials = api_key
    
    # Base64 encode the credentials
    encoded_key = base64.b64encode(credentials.encode()).decode()
    
    return {
        "Authorization": f"Basic {encoded_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


async def create_clip(
    text: str,
    presenter_id: Optional[str] = None,
) -> dict:
    """
    Create a D-ID clip using pre-made presenter.
    
    Args:
        text: The text for the avatar to speak
        presenter_id: D-ID presenter ID (uses Sophia by default)
        
    Returns:
        dict with 'id' (clip ID) and 'status'
    """
    if not presenter_id:
        presenter_id = DEFAULT_PRESENTER_ID
    
    payload = {
        "presenter_id": presenter_id,
        "script": {
            "type": "text",
            "input": text
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{DID_API_URL}/clips",
            headers=get_did_headers(),
            json=payload
        )
        
        if response.status_code not in (200, 201):
            error_detail = response.text
            print(f"D-ID API Error: Status {response.status_code}, Response: {error_detail}")
            raise ValueError(f"D-ID API error ({response.status_code}): {error_detail}")
        
        return response.json()


async def get_clip(clip_id: str) -> dict:
    """
    Get the status and result of a clip.
    
    Args:
        clip_id: The ID of the clip to check
        
    Returns:
        dict with status and result_url when done
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{DID_API_URL}/clips/{clip_id}",
            headers=get_did_headers()
        )
        
        if response.status_code != 200:
            error_detail = response.text
            print(f"D-ID API Error getting clip: Status {response.status_code}, Response: {error_detail}")
            raise ValueError(f"D-ID API error ({response.status_code}): {error_detail}")
        
        return response.json()


async def create_and_wait_for_talk(
    text: str,
    source_url: Optional[str] = None,
    voice_id: str = "en-US-JennyNeural",
    max_wait_seconds: int = 60
) -> dict:
    """
    Create a clip and wait for it to complete.
    Maintains backwards compatibility with the old function signature.
    
    Args:
        text: The text for the avatar to speak
        source_url: Ignored (kept for backwards compatibility)
        voice_id: Ignored (presenter uses its own voice)
        max_wait_seconds: Maximum time to wait for completion
        
    Returns:
        dict with result_url for the video
    """
    # Create the clip
    create_result = await create_clip(text)
    clip_id = create_result.get("id")
    
    if not clip_id:
        raise ValueError("Failed to create clip - no ID returned")
    
    print(f"D-ID clip created: {clip_id}")
    
    # Poll for completion
    elapsed = 0
    poll_interval = 2.0
    
    while elapsed < max_wait_seconds:
        clip_status = await get_clip(clip_id)
        status = clip_status.get("status")
        
        print(f"D-ID clip {clip_id} status: {status}")
        
        if status == "done":
            return clip_status
        elif status == "error":
            raise ValueError(f"Clip generation failed: {clip_status.get('error', 'Unknown error')}")
        
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
    
    raise TimeoutError(f"Clip {clip_id} did not complete within {max_wait_seconds} seconds")


# Legacy aliases for backwards compatibility
async def create_talk(text: str, source_url: Optional[str] = None, voice_id: str = "en-US-JennyNeural") -> dict:
    """Legacy function - redirects to create_clip."""
    return await create_clip(text)


async def get_talk(talk_id: str) -> dict:
    """Legacy function - redirects to get_clip."""
    return await get_clip(talk_id)
