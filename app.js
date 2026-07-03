const API_URL = 'http://localhost:3000/api';

// Page load par list automatically fetch ho jayegi
window.onload = fetchVisitors;

async function checkIn() {
    const name = document.getElementById('vName').value;
    const phone = document.getElementById('vPhone').value;
    const host = document.getElementById('vHost').value;

    if(!name || !phone || !host) return alert("All fields are required!");

    const res = await fetch(`${API_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, host })
    });
    
    const result = await res.json();
    if(result.error) alert(result.error);
    else {
        alert("Visitor Logged In!");
        document.getElementById('vName').value = '';
        document.getElementById('vPhone').value = '';
        document.getElementById('vHost').value = '';
        fetchVisitors();
    }
}

async function fetchVisitors() {
    try {
        const res = await fetch(`${API_URL}/visitors`);
        const visitors = await res.json();
        
        const list = document.getElementById('visitorList');
        list.innerHTML = '';
        
        visitors.forEach(v => {
            const li = document.createElement('li');
            // Database variables names handle mapping (visitor_name / host_name or name/host)
            const vName = v.visitor_name || v.name;
            const hName = v.host_name || v.host;
            
            li.innerHTML = `
                <strong>${vName}</strong> -> Milna hai: ${hName}
                <button class="checkout" style="margin-left:15px; background-color:#d9534f;" onclick="checkOut('${v.id}')">Punch Out</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Backend local server connected nahi hai:", err);
    }
}

async function checkOut(id) {
    const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    const result = await res.json();
    if(result.error) alert(result.error);
    else {
        alert("Visitor Checked Out!");
        fetchVisitors();
    }
}

// Global scope bindings taaki HTML forms aur click listeners functions ko execute kar sakein
window.checkIn = checkIn;
window.fetchVisitors = fetchVisitors;
window.checkOut = checkOut;

// desing.js ke sabse niche ye paste kariye
document.getElementById('punchInForm').addEventListener('submit', (e) => {
    e.preventDefault(); // page refresh hone se rokne ke liye
    checkIn();
});