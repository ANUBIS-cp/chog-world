#!/usr/bin/env python3
"""Chog scraper — filters replies, prioritizes original tweets + media."""
import json, os, re, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright
import browser_cookie3

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://sqzwubsngcncltftflyy.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY not set in environment")

QUERIES = ["$CHOG", "#chogcoin", "@chogNFT"]
SEEN_FILE = Path(os.path.expanduser("~/chog-world/seen_tweets.txt"))
CHROME_BIN = "/opt/google/chrome/chrome"
os.environ.setdefault("DISPLAY", ":20")

def load_seen():
    if SEEN_FILE.exists(): return set(SEEN_FILE.read_text().strip().splitlines())
    return set()

def save_seen(ids):
    SEEN_FILE.write_text("\n".join(ids))

def get_cookies():
    cookies = []
    try:
        cj = browser_cookie3.chrome()
        for c in cj:
            if "x.com" in c.domain or "twitter.com" in c.domain:
                cookies.append({"name": c.name, "value": c.value, "domain": c.domain, "path": c.path or "/", "httpOnly": False, "secure": True, "sameSite": "Lax"})
    except Exception as e:
        print(f"    [!] Cookie error: {e}")
    return cookies

def search_x(query):
    cookies = get_cookies()
    if not cookies: return []
    ids = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False, executable_path=CHROME_BIN,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-blink-features=AutomationControlled"])
            ctx = browser.new_context(user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")
            ctx.add_cookies(cookies)
            page = ctx.new_page()
            page.goto(f"https://x.com/search?q={query}&src=typed_query&f=live", timeout=25000, wait_until="domcontentloaded")
            page.wait_for_timeout(3000)
            for _ in range(5):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1500)
            ids = list(set(re.findall(r"/status/(\d+)", page.content())))
            ctx.close(); browser.close()
    except Exception as e:
        print(f"    [!] Search error: {str(e)[:100]}")
    return ids

def fetch_tweet(tid):
    url = f"https://cdn.syndication.twimg.com/tweet-result?id={tid}&lang=en&token=x"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"    [!] Fetch tweet {tid}: {e}")
        return None

def is_good_tweet(data):
    text = data.get("text", "")
    reply_to = data.get("in_reply_to_screen_name", "")
    user = data.get("user", {}).get("screen_name", "")
    if reply_to and reply_to != user:
        return False
    text_lower = text.lower()
    if "chog" not in text_lower:
        return False
    if len(text) < 15:
        return False
    return True

def save_tweet(data):
    text = data.get("text", "")
    user = data.get("user", {})
    x_id = data.get("id_str", "")
    sn = user.get("screen_name", "")

    media = []
    for key in ["mediaDetails", "photos"]:
        for m in (data.get(key) or []):
            u = m.get("media_url_https") or m.get("url", "")
            if u and u not in media: media.append(u)

    payload = json.dumps({
        "x_id": x_id, "x_author_handle": sn, "x_author_name": user.get("name", ""),
        "x_author_pfp": user.get("profile_image_url_https", ""), "content": text,
        "media_urls": json.dumps(media), "likes_count": data.get("favorite_count", 0),
        "retweets_count": data.get("retweet_count", 0), "posted_at": data.get("created_at", ""),
        "x_url": f"https://x.com/{sn}/status/{x_id}",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }).encode()

    headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"}
    max_retries = 3
    for attempt in range(max_retries):
        try:
            urllib.request.urlopen(urllib.request.Request(f"{SUPABASE_URL}/rest/v1/tweets", data=payload, headers=headers, method="POST"), timeout=10)
            return True
        except Exception as e:
            print(f"    [!] Save attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    return False

def run():
    print(f"[{datetime.now().isoformat()}] Scraper starting...")
    seen = load_seen(); all_ids = set()
    for q in QUERIES:
        print(f"  {q}")
        ids = search_x(q)
        print(f"    {len(ids)} IDs")
        for tid in ids:
            if tid not in seen: all_ids.add(tid)
    print(f"  New: {len(all_ids)}")
    saved = 0
    for tid in list(all_ids)[:30]:
        time.sleep(1.2)
        data = fetch_tweet(tid)
        if not data: continue
        if not is_good_tweet(data): continue
        if save_tweet(data):
            u = data.get("user", {})
            sn = u.get("screen_name", "")
            txt = data.get("text", "")
            has_img = "📷" if data.get("mediaDetails") else ""
            print(f"  [+] @{sn}: {txt[:60]} {has_img}")
            saved += 1; seen.add(tid)
    save_seen(seen)
    print(f"  Saved: {saved}, Total: {len(seen)}")

if __name__ == "__main__": run()
