/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL E-GATEPASS — Dashboard Client Module
 * Fetches analytics data, gate pass totals, and live actions.
 * ═══════════════════════════════════════════════════════════════
 */

import { initSharedFeatures, API_URL, escapeHtml } from './vgp-app.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication and setup shared features (sidebar, clock, profile)
    const operator = initSharedFeatures('menuDashboard');
    if (!operator) return; // Auth failure redirects to login

    // Update welcome banner text
    const operatorObj = JSON.parse(localStorage.getItem('vgp_operator'));
    if (operatorObj && operatorObj.full_name) {
        document.getElementById('welcomeText').textContent = `Welcome, ${operatorObj.full_name}`;
    }

    // Load initial analytics telemetry
    await loadDashboardStats();
    
    // Quick refresh loop every 10 seconds
    setInterval(loadDashboardStats, 10000);
});

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/dashboard`);
        if (!response.ok) {
            throw new Error(`API fetch error: status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update stats cards
        document.getElementById('statPassesToday').textContent = data.passesToday ?? 0;
        document.getElementById('statCurrentlyInside').textContent = data.currentlyInside ?? 0;
        document.getElementById('statExitedToday').textContent = data.exitedToday ?? 0;

        // Update Gate Counters
        updateGateProgressBar('MainGate', data.gateCounts['Main Gate'] ?? 0, data.passesToday);
        updateGateProgressBar('Gate2', data.gateCounts['Gate 2'] ?? 0, data.passesToday);
        updateGateProgressBar('Gate3', data.gateCounts['Gate 3'] ?? 0, data.passesToday);
        updateGateProgressBar('Gate4', data.gateCounts['Gate 4'] ?? 0, data.passesToday);

        // Update Recent Activity
        renderRecentActivity(data.recentActivity || []);

    } catch (err) {
        console.error('[Dashboard] Error loading analytics:', err);
    }
}

/** Update individual gate count and progress fill width percentage */
function updateGateProgressBar(gateKey, count, totalToday) {
    const countEl = document.getElementById(`count-${gateKey}`);
    const barEl = document.getElementById(`bar-${gateKey}`);
    
    if (countEl) countEl.textContent = count;
    if (barEl) {
        const percentage = totalToday > 0 ? (count / totalToday) * 100 : 0;
        barEl.style.width = `${percentage}%`;
    }
}

/** Render recent activity records inside dashboard list panel */
function renderRecentActivity(activities) {
    const listEl = document.getElementById('recentActivityList');
    if (!listEl) return;

    if (activities.length === 0) {
        listEl.innerHTML = `
            <div class="no-records">
                <span class="no-records-icon">🏭</span>
                <p>No activity recorded today</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = '';
    
    activities.forEach(act => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        const isEntry = act.action === 'ENTRY';
        const iconSymbol = isEntry ? '📥' : '📤';
        const badgeClass = isEntry ? 'in' : 'out';
        
        // Format punch timestamp
        const timeStr = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        item.innerHTML = `
            <div class="activity-left">
                <div class="activity-icon-badge ${badgeClass}">${iconSymbol}</div>
                <div class="activity-text">
                    <span class="activity-title">${escapeHtml(act.visitor_name)}</span>
                    <span class="activity-sub">${isEntry ? `Checked In to meet ${escapeHtml(act.host_name)}` : 'Checked Out / Exited'}</span>
                </div>
            </div>
            <div class="activity-right">
                <span class="activity-time">${timeStr}</span>
                <span class="activity-gate">${escapeHtml(act.gate)}</span>
            </div>
        `;
        listEl.appendChild(item);
    });
}
