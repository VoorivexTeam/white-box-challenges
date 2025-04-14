import time
import mysql.connector
from flask import Flask, request, jsonify
import phonenumbers
import random
from config import DB_CONFIG

app = Flask(__name__)

def connect_to_db():
    retries = 5
    for i in range(retries):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            return conn
        except mysql.connector.Error as err:
            print(f"Database connection failed: {err}. Retrying...")
            time.sleep(5)
    raise Exception("Failed to connect to the database after several retries")

def send_otp_code(phone):
    return 1

@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    phone_number = data.get("phone_number")

    try:
        parsed_number = phonenumbers.parse(f"+{phone_number}", None)
        if not phonenumbers.is_valid_number(parsed_number):
            return jsonify({"error": "Invalid phone number"}), 400
    except Exception as e:
        return jsonify({"error": "Invalid phone number"}), 400

    otp = random.randint(100000, 999999)

    # Connect to the database with retry logic
    conn = connect_to_db()

    try:
        cursor = conn.cursor()
        cursor.execute(f"INSERT INTO otp_codes (phone_number, otp) VALUES ('{phone_number}', '{otp}')")
        conn.commit()
    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500
    finally:
        cursor.close()
        conn.close()

    send_otp_code(phone_number)  # Function to send OTP via SMS

    return jsonify({"message": "OTP Sent"}), 200

if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0", port=5000)  # Ensure Flask listens on all interfaces
