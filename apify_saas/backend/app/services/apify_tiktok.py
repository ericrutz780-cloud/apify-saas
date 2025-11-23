from apify_client import ApifyClient
from app.core.config import settings

def fetch_tiktok_viral_live(keyword: str, limit: int):
    client = ApifyClient(token=settings.APIFY_TOKEN)

    # Strategy: Treat keyword as a hashtag
    # Use Actor: Clockworks (clockworks/tiktok-scraper)
    run_input = {
        "hashtags": [keyword.replace(" ", "")], 
        "resultsPerPage": limit,
        "shouldDownloadVideos": False, # Cost Optimization: Embeds only
        "shouldDownloadCovers": True
    }

    run = client.actor("clockworks/tiktok-scraper").call(run_input=run_input)
    
    if run and run.get("defaultDatasetId"):
        return client.dataset(run["defaultDatasetId"]).list_items().items
    return []
