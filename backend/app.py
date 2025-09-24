from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql.cursors

app = Flask(__name__)
CORS(app)

# MySQL Database Connection Configuration
db_config = {
    'host': 'localhost',
    'user': 'root',  # <--- Change this
    'password': 'Vivek@42143.',  # <--- Change this
    'db': 'customer_app_db',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    return pymysql.connect(**db_config)

# --- CRUD Operations for Customers (Updated) ---

# CREATE a new customer
@app.route('/customers', methods=['POST'])
def create_customer():
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone_number = data.get('phone_number')
    
    if not all([first_name, last_name, phone_number]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO customers (first_name, last_name, phone_number) VALUES (%s, %s, %s)"
            cursor.execute(sql, (first_name, last_name, phone_number))
            conn.commit()
            return jsonify({"message": "Customer created successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# READ all customers with search and address count
@app.route('/customers', methods=['GET'])
def get_customers():
    search_query = request.args.get('search', '').lower()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Query with a join to count addresses for each customer
            sql = """
                SELECT 
                    c.customer_id, 
                    c.first_name, 
                    c.last_name, 
                    c.phone_number, 
                    COUNT(a.address_id) AS address_count,
                    GROUP_CONCAT(a.city) as cities,
                    GROUP_CONCAT(a.state) as states,
                    GROUP_CONCAT(a.pin_code) as pin_codes
                FROM customers c
                LEFT JOIN addresses a ON c.customer_id = a.customer_id
                GROUP BY c.customer_id
            """
            cursor.execute(sql)
            customers = cursor.fetchall()
            
            # Filter results in Python based on the search query
            if search_query:
                customers = [
                    c for c in customers 
                    if search_query in c['first_name'].lower() or
                       search_query in c['last_name'].lower() or
                       search_query in c['phone_number'].lower() or
                       (c['cities'] and search_query in c['cities'].lower()) or
                       (c['states'] and search_query in c['states'].lower()) or
                       (c['pin_codes'] and search_query in c['pin_codes'].lower())
                ]
            
            return jsonify(customers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# READ a single customer with addresses
@app.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql_customer = "SELECT * FROM customers WHERE customer_id = %s"
            cursor.execute(sql_customer, (customer_id,))
            customer = cursor.fetchone()
            if not customer:
                return jsonify({"error": "Customer not found"}), 404

            sql_addresses = "SELECT * FROM addresses WHERE customer_id = %s"
            cursor.execute(sql_addresses, (customer_id,))
            addresses = cursor.fetchall()
            
            customer['addresses'] = addresses
            return jsonify(customer), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# UPDATE a customer
@app.route('/customers/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone_number = data.get('phone_number')
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "UPDATE customers SET first_name = %s, last_name = %s, phone_number = %s WHERE customer_id = %s"
            cursor.execute(sql, (first_name, last_name, phone_number, customer_id))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"error": "Customer not found"}), 404
            return jsonify({"message": "Customer updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# DELETE a customer
@app.route('/customers/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "DELETE FROM customers WHERE customer_id = %s"
            cursor.execute(sql, (customer_id,))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"error": "Customer not found"}), 404
            return jsonify({"message": "Customer deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# --- CRUD Operations for Addresses (Updated) ---

# Add a new address
@app.route('/addresses', methods=['POST'])
def add_address():
    data = request.json
    customer_id = data.get('customer_id')
    street_address = data.get('street_address')
    city = data.get('city')
    state = data.get('state')
    pin_code = data.get('pin_code')
    if not all([customer_id, street_address, city, state, pin_code]):
        return jsonify({"error": "Missing required address fields"}), 400
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "INSERT INTO addresses (customer_id, street_address, city, state, pin_code) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(sql, (customer_id, street_address, city, state, pin_code))
            conn.commit()
            return jsonify({"message": "Address added successfully"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# READ a single address by ID
@app.route('/addresses/<int:address_id>', methods=['GET'])
def get_address(address_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT * FROM addresses WHERE address_id = %s"
            cursor.execute(sql, (address_id,))
            address = cursor.fetchone()
            if not address:
                return jsonify({"error": "Address not found"}), 404
            return jsonify(address), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# UPDATE an address
@app.route('/addresses/<int:address_id>', methods=['PUT'])
def update_address(address_id):
    data = request.json
    street_address = data.get('street_address')
    city = data.get('city')
    state = data.get('state')
    pin_code = data.get('pin_code')
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "UPDATE addresses SET street_address=%s, city=%s, state=%s, pin_code=%s WHERE address_id=%s"
            cursor.execute(sql, (street_address, city, state, pin_code, address_id))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"error": "Address not found"}), 404
            return jsonify({"message": "Address updated successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# DELETE an address
@app.route('/addresses/<int:address_id>', methods=['DELETE'])
def delete_address(address_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            sql = "DELETE FROM addresses WHERE address_id = %s"
            cursor.execute(sql, (address_id,))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"error": "Address not found"}), 404
            return jsonify({"message": "Address deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)
