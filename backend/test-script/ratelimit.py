import requests
import urllib.parse
import time

base_url = "http://localhost:8000/trpc/users.getUserById"

input_obj = {"id": 1}
encoded_input = urllib.parse.quote_plus(str(input_obj).replace("'", '"'))
url = f"{base_url}?input={encoded_input}"

# Number of req/s (adjust to test limits)
requests_per_second = 5
delay = 1 / requests_per_second

count = 0

while True:
    try:
        response = requests.get(url)
        count += 1
        print(f"[{count}] Status: {response.status_code} | Response: {response.text}")
    except Exception as e:
        print(f"[{count}] Error: {e}")
    time.sleep(delay)
