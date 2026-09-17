import os
import re
from datetime import datetime
from pathlib import Path
from groq import Groq

city = os.environ.get("CITY_NAME", "").strip()
country = os.environ.get("COUNTRY_NAME", "India").strip()
api_key = os.environ.get("GROQ_API_KEY")

if not city:
    raise SystemExit("CITY_NAME is required")
if not api_key:
    raise SystemExit("GROQ_API_KEY secret is required")

slug = re.sub(r"[^a-z0-9]+", "-", city.lower()).strip("-")
client = Groq(api_key=api_key)

prompt = f'''Create a useful, original city guide for {city}, {country} for the Cityvora website.
Return ONLY the article body in Markdown, no YAML/front matter.
Use these headings: Introduction, What to See, Neighborhoods, Food to Try, Two-Day Itinerary, Best Time to Visit, Practical Tips.
Do not invent exact prices, opening hours, addresses, statistics, or claims that require live verification. Keep recommendations practical and descriptive.'''

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You are a careful travel editor writing concise, original city guides."},
        {"role": "user", "content": prompt},
    ],
    temperature=0.65,
    max_tokens=5000,
)
body = response.choices[0].message.content.strip()
now = datetime.now().astimezone().isoformat(timespec="seconds")

front = f'''---
title: "{city} City Guide: Places, Food and Experiences"
description: "A practical Cityvora guide to {city}, covering places to see, local food, neighborhoods, itinerary ideas and travel tips."
date: {now}
draft: false
country: "{country}"
region: "City Guide"
image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1800&q=85"
tags:
  - {city}
  - {country}
  - City Guide
  - Travel
---

'''

path = Path("content/cities") / f"{slug}.md"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(front + body + "\n", encoding="utf-8")
print(f"Wrote {path}")
