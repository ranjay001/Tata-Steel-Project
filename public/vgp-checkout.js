/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL E-GATEPASS — Check Out Controller Script
 * Fetches inside visitors, matches search inputs, performs checkout.
 * ═══════════════════════════════════════════════════════════════
 */

import { initSharedFeatures, API_URL, escapeHtml, showToast } from './vgp-app.js';

let activeVisitors = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Auth guard & navbar clock initialization
    const operator = initSharedFeatures('menuCheckOut');
    if (!operator) return;

    // Fetch and display current entries
    await fetchActiveVisitors();

    // Bind real-time search input
    const searchInput = document.getElementById('checkoutSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterAndRender(query);
        });
    }
});

/** Fetch list of active visitors inside the plant */
async function fetchActiveVisitors() {
    try {
        const response = await fetch(`${API_URL}/active`);
        if (!response.ok) {
            throw new Error(`API error: status ${response.status}`);
        }
        
        activeVisitors = await response.json();
        
        // Render all records initially
        filterAndRender('');
    } catch (err) {
        console.error('[Check Out] Load active list error:', err);
        showToast('Error loading active visitors list.', 'error');
    }
}

/** Filter and render visitor cards based on search query */
function filterAndRender(query) {
    const listEl = document.getElementById('activeVisitorsList');
    const countEl = document.getElementById('activeCount');
    if (!listEl) return;

    // Filter array
    const filtered = activeVisitors.filter(v => {
        const nameMatch = v.visitor_name.toLowerCase().includes(query);
        const phoneMatch = v.phone.toLowerCase().includes(query);
        const passMatch = v.pass_number.toLowerCase().includes(query);
        return nameMatch || phoneMatch || passMatch;
    });

    // Update active count text
    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="no-records" style="grid-column: 1/-1;">
                <span class="no-records-icon">🔍</span>
                <p>${query ? 'No matching visitors found' : 'No active visitors currently inside'}</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = '';
    
    filtered.forEach(v => {
        const card = document.createElement('div');
        card.className = 'visitor-card';
        card.dataset.id = v.id;

        // Checked In Time Format: 10:15 AM
        const timeStr = new Date(v.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div>
                <div class="visitor-card-header">
                    <span class="visitor-card-name">${escapeHtml(v.visitor_name)}</span>
                    <span class="visitor-card-pass">${escapeHtml(v.pass_number)}</span>
                </div>
                
                <div class="visitor-card-field">
                    <span class="visitor-card-label">Company:</span>
                    <span class="visitor-card-value">${escapeHtml(v.company || 'N/A')}</span>
                </div>
                <div class="visitor-card-field">
                    <span class="visitor-card-label">Phone:</span>
                    <span class="visitor-card-value">${escapeHtml(v.phone)}</span>
                </div>
                <div class="visitor-card-field">
                    <span class="visitor-card-label">Whom to Meet:</span>
                    <span class="visitor-card-value">${escapeHtml(v.host_name)}</span>
                </div>
                <div class="visitor-card-field">
                    <span class="visitor-card-label">Gate:</span>
                    <span class="visitor-card-value">${escapeHtml(v.entry_gate)}</span>
                </div>
            </div>
            
            <div class="visitor-card-footer">
                <span class="visitor-card-time">📥 In: ${timeStr}</span>
                <button class="btn-checkout-card" data-checkout-id="${v.id}">Check Out</button>
            </div>
        `;

        // Programmatic Event Listener for Check Out Action button
        const btn = card.querySelector('.btn-checkout-card');
        btn.addEventListener('click', () => {
            performCheckOut(v.id, v.visitor_name, card);
        });

        listEl.appendChild(card);
    });
}

/** Fire check-out update and remove card visual */
async function performCheckOut(id, name, cardElement) {
    if (!confirm(`Are you sure you want to check out ${name}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(`🚪 Checked out ${name} successfully!`, 'success');
            
            // Remove from local array to prevent full re-fetching
            activeVisitors = activeVisitors.filter(v => v.id !== id);
            
            // Re-render
            const searchInput = document.getElementById('checkoutSearch');
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            filterAndRender(query);
        } else {
            showToast(result.error || 'Failed to check out visitor.', 'error');
        }
    } catch (err) {
        console.error('[Check Out] API action error:', err);
        showToast('Network error during check-out.', 'error');
    }
}
