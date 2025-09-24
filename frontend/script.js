const BACKEND_URL = 'http://127.0.0.1:5000';

const customerForm = document.getElementById('customer-form');
const customerList = document.getElementById('customer-list');
const customerIdInput = document.getElementById('customer-id');
const submitBtn = document.getElementById('submit-btn');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const clearFormBtn = document.getElementById('clear-btn'); // New clear button for the form

const mainView = document.getElementById('main-view');
const detailView = document.getElementById('detail-view');
const backToListBtn = document.getElementById('back-to-list-btn');
const customerNameDisplay = document.getElementById('customer-name-display');
const customerInfoDisplay = document.getElementById('customer-info-display');

const additionalAddressesContainer = document.getElementById('additional-addresses-container');
const addAddressFieldsBtn = document.getElementById('add-address-fields-btn');

const addressForm = document.getElementById('address-form');
const addressIdInput = document.getElementById('address-id');
const addressCustomerIdInput = document.getElementById('address-customer-id');
const addressList = document.getElementById('address-list');

// --- Main Customer List Operations ---

// Function to fetch and display customers
async function fetchCustomers(query = '') {
    try {
        const response = await fetch(`${BACKEND_URL}/customers?search=${encodeURIComponent(query)}`);
        const customers = await response.json();
        renderCustomers(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
    }
}

// Function to render customers on the page
function renderCustomers(customers) {
    customerList.innerHTML = '';
    if (customers.length === 0) {
        customerList.innerHTML = '<p>No customers found.</p>';
        return;
    }
    customers.forEach(customer => {
        const li = document.createElement('li');
        const hasMultipleAddresses = customer.address_count > 1;
        const addressStatus = hasMultipleAddresses ? 'Multiple Addresses' : 'Only One Address';
        
        li.innerHTML = `
            <span>${customer.first_name} ${customer.last_name} - ${customer.phone_number} (ID: ${customer.customer_id})</span>
            <span class="${hasMultipleAddresses ? 'multiple-address' : 'single-address'}">${addressStatus}</span>
            <div class="customer-actions">
                <button onclick="viewCustomerDetails(${customer.customer_id})">View</button>
                <button onclick="editCustomer(${customer.customer_id})">Edit</button>
                <button onclick="deleteCustomer(${customer.customer_id})">Delete</button>
            </div>
        `;
        customerList.appendChild(li);
    });
}

// Search functionality
searchInput.addEventListener('keyup', (e) => {
    fetchCustomers(e.target.value);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    fetchCustomers();
});

// Clear Form button
clearFormBtn.addEventListener('click', () => {
    customerForm.reset();
    customerIdInput.value = '';
    submitBtn.textContent = 'Add Customer';
    additionalAddressesContainer.innerHTML = ''; // Clear dynamically added fields
});

// --- Dynamic Address Field Addition ---
addAddressFieldsBtn.addEventListener('click', () => {
    const addressFields = `
        <hr>
        <h4>Additional Address</h4>
        <label for="street">Street Address:</label>
        <input type="text" name="street[]" required>

        <label for="city">City:</label>
        <input type="text" name="city[]" required>

        <label for="state">State:</label>
        <input type="text" name="state[]" required>

        <label for="pincode">Pin Code:</label>
        <input type="text" name="pincode[]" required>
    `;
    additionalAddressesContainer.insertAdjacentHTML('beforeend', addressFields);
});


// --- Customer Form Submission with Validation and Feedback ---
customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Client-side validation
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const street = document.getElementById('street').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const pincode = document.getElementById('pincode').value.trim();

    if (!firstName || !lastName || !phone || !street || !city || !state || !pincode) {
        alert("All fields are mandatory. Please fill in all customer and address details.");
        return;
    }

    const customerId = customerIdInput.value;
    const customerData = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        street_address: street,
        city: city,
        state: state,
        pin_code: pincode
    };

    const method = customerId ? 'PUT' : 'POST';
    const url = customerId ? `${BACKEND_URL}/customers/${customerId}` : `${BACKEND_URL}/customers`;

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
    });
    
    const result = await response.json();

    if (response.ok) {
        alert(result.message);
    } else {
        alert("Error: " + result.error);
    }
    
    customerForm.reset();
    customerIdInput.value = '';
    submitBtn.textContent = 'Add Customer';
    fetchCustomers();
});

// Function to populate the form for editing
async function editCustomer(id) {
    const response = await fetch(`${BACKEND_URL}/customers/${id}`);
    const customer = await response.json();
    document.getElementById('firstName').value = customer.first_name;
    document.getElementById('lastName').value = customer.last_name;
    document.getElementById('phone').value = customer.phone_number;
    customerIdInput.value = customer.customer_id;
    submitBtn.textContent = 'Update Customer';
    
    // Clear address fields as they are handled in the detail view
    document.getElementById('street').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('pincode').value = '';
    additionalAddressesContainer.innerHTML = '';
}

// Function to delete a customer
async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        const response = await fetch(`${BACKEND_URL}/customers/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
        } else {
            alert("Error: " + result.error);
        }
        
        fetchCustomers();
    }
}

// --- Detail View & Address Operations ---

// Navigate to a single customer's detail view
async function viewCustomerDetails(id) {
    try {
        const response = await fetch(`${BACKEND_URL}/customers/${id}`);
        const customer = await response.json();
        
        customerNameDisplay.textContent = `${customer.first_name} ${customer.last_name} (ID: ${customer.customer_id})`;
        customerInfoDisplay.innerHTML = `
            <p><strong>Phone:</strong> ${customer.phone_number}</p>
        `;
        
        addressCustomerIdInput.value = customer.customer_id;
        renderAddresses(customer.addresses);
        
        mainView.style.display = 'none';
        detailView.style.display = 'block';
    } catch (error) {
        console.error('Error fetching customer details:', error);
    }
}

// Render addresses for a customer
function renderAddresses(addresses) {
    addressList.innerHTML = '';
    if (addresses.length === 0) {
        addressList.innerHTML = '<p>No addresses found.</p>';
        return;
    }
    addresses.forEach(address => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${address.street_address}, ${address.city}, ${address.state} - ${address.pin_code}</span>
            <div class="address-actions">
                <button onclick="editAddress(${address.address_id})">Edit</button>
                <button onclick="deleteAddress(${address.address_id})">Delete</button>
            </div>
        `;
        addressList.appendChild(li);
    });
}

// Address form submission (Add/Update)
addressForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const addressId = addressIdInput.value;
    const customerId = addressCustomerIdInput.value;
    const addressData = {
        customer_id: customerId,
        street_address: document.getElementById('detailStreet').value,
        city: document.getElementById('detailCity').value,
        state: document.getElementById('detailState').value,
        pin_code: document.getElementById('detailPincode').value,
    };

    const method = addressId ? 'PUT' : 'POST';
    const url = addressId ? `${BACKEND_URL}/addresses/${addressId}` : `${BACKEND_URL}/addresses`;

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
    });
    
    const result = await response.json();

    if (response.ok) {
        alert(result.message);
    } else {
        alert("Error: " + result.error);
    }
    
    addressForm.reset();
    addressIdInput.value = '';
    document.getElementById('add-address-btn').textContent = 'Add Address';
    viewCustomerDetails(customerId); // Refresh the address list
});

// Populate form for editing an address
async function editAddress(id) {
    const response = await fetch(`${BACKEND_URL}/addresses/${id}`);
    const address = await response.json();
    
    document.getElementById('detailStreet').value = address.street_address;
    document.getElementById('detailCity').value = address.city;
    document.getElementById('detailState').value = address.state;
    document.getElementById('detailPincode').value = address.pin_code;
    addressIdInput.value = address.address_id;
    document.getElementById('add-address-btn').textContent = 'Update Address';
}

// Delete an address
async function deleteAddress(id) {
    if (confirm('Are you sure you want to delete this address?')) {
        const response = await fetch(`${BACKEND_URL}/addresses/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
        } else {
            alert("Error: " + result.error);
        }
        
        viewCustomerDetails(addressCustomerIdInput.value); // Refresh the address list
    }
}

// Navigation back to main list
backToListBtn.addEventListener('click', () => {
    mainView.style.display = 'block';
    detailView.style.display = 'none';
    fetchCustomers(); // Refresh the main list
});

// Initial fetch
fetchCustomers();