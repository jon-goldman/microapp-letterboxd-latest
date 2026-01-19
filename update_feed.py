import urllib.request
import xml.etree.ElementTree as ET
import json
import re
import os

# 1. Configuration - Updated to your specific Letterboxd handle
RSS_URL = "https://letterboxd.com/jongoldman/rss/"

def parse_rating(title):
    match = re.search(r'([★☆½]+)$', title)
    return match.group(1) if match else None

def clean_title(title):
    return re.sub(r' - [★☆½]+$', '', title).strip()

try:
    print(f"Fetching RSS from {RSS_URL}...")
    # Use a User-Agent to prevent Letterboxd from blocking the request
    req = urllib.request.Request(RSS_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    items = []

    for item in root.findall('./channel/item')[:5]:
        raw_title = item.find('title').text
        link = item.find('link').text
        
        # Improved parsing for Title, Year - Rating
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

    # Save to the root directory explicitly
    with open('feed.json', 'w') as f:
        json.dump(items, f, indent=2)
    
    print("Successfully created feed.json")

except Exception as e:
    print(f"Error occurred: {e}")
    exit(1)
