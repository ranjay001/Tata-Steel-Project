/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL E-GATEPASS — Visitor Log Search and Export Script
 * Handles real-time filtering and download pipelines.
 * ═══════════════════════════════════════════════════════════════
 */

import { initSharedFeatures, API_URL, escapeHtml, showToast } from './vgp-app.js';

document.addEventListener('DOMContentLoaded', () => {
    // Auth guard & shared elements setup
    const operator = initSharedFeatures('menuVisitorLog');
    if (!operator) return;

    // Set default date range to today's date in local time
    const todayStr = new Date().toISOString().split('T')[0];
    const fromInput = document.getElementById('filterFrom');
    const toInput = document.getElementById('filterTo');
    
    if (fromInput) fromInput.value = todayStr;
    if (toInput) toInput.value = todayStr;

    // Run initial search
    fetchLogs();

    // Bind event listeners to filter fields programmatically
    const filterIds = ['filterFrom', 'filterTo', 'filterGate', 'filterStatus'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', fetchLogs);
    });

    const searchInput = document.getElementById('filterSearch');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchLogs, 400); // Debounce search typings
        });
    }

    // Bind Export Button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', triggerCSVExport);
    }
});

/** Construct URL search parameters from current filter inputs */
function getQueryParams() {
    const fromVal = document.getElementById('filterFrom').value;
    const toVal = document.getElementById('filterTo').value;
    const gateVal = document.getElementById('filterGate').value;
    const statusVal = document.getElementById('filterStatus').value;
    const searchVal = document.getElementById('filterSearch').value.trim();

    const params = new URLSearchParams();
    if (fromVal) params.append('from', fromVal);
    if (toVal) params.append('to', toVal);
    if (gateVal) params.append('gate', gateVal);
    if (statusVal) params.append('status', statusVal);
    if (searchVal) params.append('search', searchVal);

    return params.toString();
}

/** Fetch filtered visitor logs from backend database */
async function fetchLogs() {
    const tableBody = document.getElementById('logTableBody');
    if (!tableBody) return;

    try {
        const queryString = getQueryParams();
        const response = await fetch(`${API_URL}/log?${queryString}`);
        
        if (!response.ok) {
            throw new Error(`API error: status ${response.status}`);
        }

        const data = await response.json();
        const records = data.records || [];

        // Update stats boxes
        document.getElementById('logStatTotal').textContent = data.stats.total || 0;
        document.getElementById('logStatInside').textContent = data.stats.inside || 0;
        document.getElementById('logStatExited').textContent = data.stats.exited || 0;
        document.getElementById('recordsCount').textContent = `Records (${records.length})`;

        // Render Table Data
        renderLogTable(records);
    } catch (err) {
        console.error('[Visitor Log] Failed to fetch data:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--danger); padding: 40px 0;">
                    ⚠️ Error loading log records. Make sure the database connection is active.
                </td>
            </tr>
        `;
    }
}

/** Render array of logs inside DOM table element */
function renderLogTable(records) {
    const tableBody = document.getElementById('logTableBody');
    if (!tableBody) return;

    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                    No records found for the selected filter criteria.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = '';

    records.forEach(r => {
        const tr = document.createElement('tr');
        
        // Status Badge formatting
        const isInside = r.punch_type === 'IN';
        const statusText = isInside ? '● Inside' : '✓ Exited';
        const statusClass = isInside ? 'inside' : 'exited';

        // Time formatters
        const formatTime = (timeStr) => {
            if (!timeStr) return '-';
            const d = new Date(timeStr);
            return d.toLocaleString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short',
                hour12: true
            });
        };

        tr.innerHTML = `
            <td><strong>${escapeHtml(r.pass_number)}</strong></td>
            <td>${escapeHtml(r.visitor_name)}</td>
            <td>${escapeHtml(r.phone)}</td>
            <td>${escapeHtml(r.company || '-')}</td>
            <td>${escapeHtml(r.host_name)}</td>
            <td>${escapeHtml(r.entry_gate)}</td>
            <td>${formatTime(r.checked_in_at)}</td>
            <td>${formatTime(r.checked_out_at)}</td>
            <td>
                <span class="badge-status ${statusClass}">${statusText}</span>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

/** Trigger backend export action to stream CSV download file */
function triggerCSVExport() {
    const queryString = getQueryParams();
    // Redirect browser to trigger native file download stream
    window.location.href = `${API_URL}/export?${queryString}`;
    showToast('Exporting log data to CSV...', 'success');
}
