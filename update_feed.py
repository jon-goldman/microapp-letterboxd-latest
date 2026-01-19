import urllib.request
import xml.etree.ElementTree as ET
import json
import re

# IMPORTANT: Change 'jonathangoldman' to your actual Letterboxd username
RSS_URL = "https://letterboxd.com/jonathangoldman/rss/"

def parse_rating(title):
    match = re.search(r'([★☆½]+)$', title)
    return match.group(1) if match else None

def clean_title(title):
    return re.sub(r' - [★☆½]+$', '', title).strip()

try:
    with urllib.request.urlopen(RSS_URL) as response:
        xml_data = response.read()
    
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

    with open('feed.json', 'w') as f:
        json.dump(items, f, indent=2)
    print("Successfully wrote feed.json")

except Exception as e:
    print(f"Error: {e}")
