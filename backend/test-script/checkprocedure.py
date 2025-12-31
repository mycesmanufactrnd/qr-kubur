import requests
import json
import urllib.parse

# change the procedure for testing role
URL = "http://localhost:4000/trpc/users.getUserById"

# change the JWT
JWT_TOKENS = {
    "admin": "<ADMIN_JWT>",
    "superadmin": "<SUPERADMIN_JWT>",
    "employee": "<EMPLOYEE_JWT>",
    "unauthorized": ""
}
USER_ID_TO_TEST = 1

def test_role(role_name, token):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    params = {
        "input": json.dumps({"id": USER_ID_TO_TEST})
    }

    query_string = urllib.parse.urlencode(params)
    full_url = f"{URL}?{query_string}"

    response = requests.get(full_url, headers=headers)
    
    print(f"--- Testing role: {role_name} ---")
    print("Status code:", response.status_code)
    print("Response:", response.text)
    print("\n")


for role, token in JWT_TOKENS.items():
    test_role(role, token)
