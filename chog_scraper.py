#!/usr/bin/env python3
"""Chog scraper v10 — browser_cookie3 + Playwright with cookie injection, syndication API for content."""
import json, os, re, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path

import browser_cookie3

SUPABASE_URL = "https://sqzwubsngcncltftflyy.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxend1YnNuZ2NuY2x0ZnRmbHl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk1NTg3MiwiZXhwIjoyMDk1NTMxODcyfQ.OJWCIISRhMkw5_nEJ-aur8W9ZtMoviP7jDx2BREjVbs"

QUERIES = ["$CHOG", "#chogcoin", "@chogNFT"]
SEEN_FILE = Path(os.path.expanduser("~/chog-world/seen_tweets.txt"))
CHROME_BIN = "/opt/google/chrome/chrome"

os.environ.setdefault("DISPLAY", ":20")

def load_seen():
    if SEEN_FILE.exists():
        return set(SEEN_FILE.read_text().strip().splitlines())
    return set()

def save_seen(ids):
    SEEN_FILE.write_text("\n".join(ids))

def get_cookies():
    """Get decrypted X cookies using browser_cookie3."""
    cookies = []
    try:
        cj = browser_cookie3.chrome()
        for c in cj:
            if "x.com" in c.domain or "twitter.com" in c.domain:
                cookies.append({
                    "name": c.name,
                    "value": c.value,
                    "domain": c.domain,
                    "path": c.path or "/",
                    "httpOnly": False,
                    "secure": True,
                    "sameSite": "Lax",
                })
    except Exception as e:
        print(f"  [!] Cookie error: {e}")
    return cookies

def search_x_with_cookies(query):
    """Search X using Playwright with injected cookies (non-headless via Xvfb)."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return []

    cookies = get_cookies()
    if not cookies:
        print("  [!] No cookies found")
        return []

    ids = []
    url = f"https://x.com/search?q={query}&src=typed_query&f=live"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,
                executable_path=CHROME_BIN,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
                      "--disable-blink-features=AutomationControlled"]
            )
            context = browser.new_context(
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800},
            )
            context.add_cookies(cookies)

            page = context.new_page()
            
            # Navigate to X first to establish session
            page.goto("https://x.com", timeout=20000, wait_until="domcontentloaded")
            page.wait_for_timeout(2000)

            # Check if we're logged in
            logged_in = page.query_selector('[data-testid="SideNav_NewTweet_Button"]') or \
                        page.query_selector('a[aria-label="Profile"]')
            print(f"    Login status: {'logged in' if logged_in else 'NOT logged in'}")

            # Search
            page.goto(url, timeout=20000, wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

            # Scroll to load tweets
            for i in range(4):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1500)

            html = page.content()
            
            # Extract tweet IDs from links
            found = re.findall(r"/status/(\d+)", html)
            ids = list(set(found))

            context.close()
            browser.close()
    except Exception as e:
        print(f"    [err]: {str(e)[:200]}")

    return ids

def fetch_tweet_content(tweet_id):
    """Fetch tweet via syndication API — same method as xfetch.py."""
    url = f"https://cdn.syndication.twimg.com/tweet-result?id={tweet_id}&lang=en&token=x"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except:
        return None

def save_tweet_to_db(tweet_data):
    text = tweet_data.get("text", "")
    user = tweet_data.get("user", {})
    x_id = tweet_data.get("id_str", "")

    if not any(t in text.lower() for t in ["chog"]):
        return False

    screen_name = user.get("screen_name", "")
    x_url = f"https://x.com/{screen_name}/status/{x_id}"

    media = []
    for key in ["mediaDetails", "photos"]:
        for m in (tweet_data.get(key) or []):
            u = m.get("media_url_https") or m.get("url", "")
            if u:
                media.append(u)

    payload = json.dumps({
        "x_id": x_id, "x_author_handle": screen_name,
        "x_author_name": user.get("name", ""),
        "x_author_pfp": user.get("profile_image_url_https", ""),
        "content": text, "media_urls": json.dumps(media),
        "likes_count": tweet_data.get("favorite_count", 0),
        "retweets_count": tweet_data.get("retweet_count", 0),
        "posted_at": tweet_data.get("created_at", ""),
        "x_url": x_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }).encode()

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    try:
        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/tweets", data=payload, headers=headers, method="POST")
        urllib.request.urlopen(req, timeout=10)
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        if "duplicate" not in body.lower():
            print(f"    [!] DB: {body[:100]}")
        return False

def run():
    print(f"[{datetime.now().isoformat()}] Chog scraper v10 starting...")
    seen = load_seen()
    all_ids = set()

    for query in QUERIES:
        print(f"  Search: {query}")
        ids = search_x_with_cookies(query)
        print(f"    Found {len(ids)} tweet IDs")
        for tid in ids:
            if tid not in seen:
                all_ids.add(tid)

    print(f"  New to fetch: {len(all_ids)}")
    saved = 0
    for tid in list(all_ids)[:30]:
        time.sleep(1.5)
        data = fetch_tweet_content(tid)
        if data:
            if save_tweet_to_db(data):
                user = data.get("user", {})
                print(f"  [+] @{user.get('screen_name','?')}: {data.get('text','')[:80]}")
                saved += 1
                seen.add(tid)
        else:
            # If syndication API fails, the tweet might be too new — skip
            pass

    save_seen(seen)
    print(f"  Done. New: {saved}, Total: {len(seen)}")

if __name__ == "__main__":
    run()
