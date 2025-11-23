from apify_client import ApifyClient
from app.core.config import settings

def fetch_meta_ads_live(keyword: str, country: str, limit: int):
    client = ApifyClient(token=settings.APIFY_TOKEN)
    
    # Dynamic URL Construction (The "URL Trick")
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=all&ad_type=all&country={country}&q={keyword}"
        f"&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all"
    )

    run_input = {
        "urls": [{"url": search_url}],
        "maxItems": limit
    }

    # Execute Actor: Curious Coder (XtaWFhbtfxyzqrFmd)
    run = client.actor("XtaWFhbtfxyzqrFmd").call(run_input=run_input)
    
    # Fetch and return results
    if run and run.get("defaultDatasetId"):
        return client.dataset(run["defaultDatasetId"]).list_items().items
    return []

