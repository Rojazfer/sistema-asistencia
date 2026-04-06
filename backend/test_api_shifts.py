#!/usr/bin/env python
import requests
import json

url = "http://localhost:8000/api/shift-configs/"
response = requests.get(url)

if response.status_code == 200:
    shifts = response.json()
    print("✅ API Response (First 5 shifts):")
    print(json.dumps(shifts[:5], indent=2))
    print(f"\n📊 Total shifts: {len(shifts)}")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
