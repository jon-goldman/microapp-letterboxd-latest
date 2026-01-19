import urllib.request
import xml.etree.ElementTree as ET
import json
import re

# 1. Configuration - Using your Letterboxd handle
RSS_URL = "https://letterboxd.com/jonathangoldman/rss/"

def parse_rating(title):
    match = re.search(r'([★☆½]+)$', title)
    return match.group(1) if match else None

def clean_title(title):
    return re.sub(r' - [★☆½]+$', '', title).strip()

try:
    # 2. Fetch
    print(f"Fetching RSS from {RSS_URL}...")
    with urllib.request.urlopen(RSS_URL) as response:
        xml_data = response.read()
    
    # 3. Parse
    root = ET.fromstring(xml_data)
    items = []

    for item in root.findall('./channel/item')[:5]:
        raw_title = item.find('title').text
        link = item.find('link').text
        
        title_parts = raw_title.split(', ')
        name = clean_title(title_parts[0])
        year = title_parts[1].split(' - ')[0] if len(title_parts) > 1 else ""
        rating = parse_rating(raw_title)

        items.append({
            "title": name,
            "year": year,
            "rating": rating,
            "link": link
        })

    # 4. Save - We use a simple filename here to match the Action's expectations
    with open('feed.json', 'w') as f:
        json.dump(items, f, indent=2)
    
    print("Successfully created feed.json")

except Exception as e:
    print(f"Error occurred: {e}")
    # We exit with an error so the GitHub Action knows the 'Chef' failed
    exit(1)
