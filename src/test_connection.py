import mysql.connector

def test_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",          # or your MySQL username
            password="Ice27cream!!",
            database="fishing_db"
        )
        if connection.is_connected():
            print("✅ Connection successful!")
    except mysql.connector.Error as err:
        print(f"❌ Error: {err}")
    finally:
        if connection.is_connected():
            connection.close()

if __name__ == "__main__":
    test_connection()