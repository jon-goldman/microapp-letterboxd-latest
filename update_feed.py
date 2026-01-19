import urllib.request
import xml.etree.ElementTree as ET
import json
import re
import os

# 1. Configuration
RSS_URL = "https://letterboxd.com/jonathangoldman/rss/"

def parse_rating(title):
    # Extracts stars (e.g., ★★★★) from the end of the Letterboxd title string
    match = re.search(r'([★☆½]+)$', title)
    return match.group(1) if match else None

def clean_title(title):
    # Removes the rating suffix so you just have the movie name
    return re.sub(r' - [★☆½]+$', '', title).strip()

try:
    # 2. Fetch the RSS data
    with urllib.request.urlopen(RSS_URL) as response:
        xml_data = response.read()
    
    # 3. Parse the XML
    root = ET.fromstring(xml_data)
    items = []

    # Letterboxd RSS items are structured: Title, Year - Rating
    for item in root.findall('./channel/item')[:5]: # We only take the 5 most recent
        raw_title = item.find('title').text
        link = item.find('link').text
        
        # Split title and year
        title_parts = raw_title.split(', ')
        name = clean_title(title_parts[0])
        
        # Extract year and rating
        year = title_parts[1].split(' - ')[0] if len(title_parts) > 1 else ""
        rating = parse_rating(raw_title)

        items.append({
            "title": name,
            "year": year,
            "rating": rating,
            "link": link
        })

    # 4. Save to feed.json in the current directory
    file_path = os.path.join(os.getcwd(), 'feed.json')
    with open(file_path, 'w') as f:
        json.dump(items, f, indent=2)
    
    print(f"Successfully wrote feed.json to {file_path}")

except Exception as e:
    print(f"Error: {e}")
