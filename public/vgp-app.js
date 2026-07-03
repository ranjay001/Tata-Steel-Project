/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL E-GATEPASS — Shared Frontend JS Utility Module
 * Handles session protection, logout, shared layouts, clock.
 * ═══════════════════════════════════════════════════════════════
 */

// API Gateway Base URL
export const API_URL = '/api/vgp';

/**
 * Check if the operator session is valid. Redirects to login page if invalid.
 */
export function checkAuth() {
    const sessionToken = localStorage.getItem('vgp_session_token');
    const operatorData = localStorage.getItem('vgp_operator');
    
    // If not authenticated, redirect to login
    if (!sessionToken || !operatorData) {
        localStorage.removeItem('vgp_session_token');
        localStorage.removeItem('vgp_operator');
        window.location.href = 'vgp-login.html';
        return null;
    }
    
    try {
        return JSON.parse(operatorData);
    } catch (e) {
        window.location.href = 'vgp-login.html';
        return null;
    }
}

/**
 * Initialize components shared across all page views.
 * Call this inside DOMContentLoaded in page scripts.
 */
export function initSharedFeatures(activeMenuId) {
    const operator = checkAuth();
    if (!operator) return;

    // Display operator profile in sidebar
    const nameEl = document.getElementById('operatorName');
    const roleEl = document.getElementById('operatorRole');
    if (nameEl) nameEl.textContent = operator.full_name || operator.user_id;
    if (roleEl) roleEl.textContent = `Operator (${operator.assigned_gate || 'Main Gate'})`;

    // Highlight active menu item
    if (activeMenuId) {
        const activeLink = document.getElementById(activeMenuId);
        if (activeLink) {
            activeLink.parentElement.classList.add('active');
        }
    }

    // Bind logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Set up live clock
    updateClock();
    setInterval(updateClock, 1000);

    return operator;
}

/**
 * Perform secure logout
 */
export function logout() {
    localStorage.removeItem('vgp_session_token');
    localStorage.removeItem('vgp_operator');
    window.location.href = 'vgp-login.html';
}

/**
 * Update the header clock dynamically
 */
function updateClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;
    
    const now = new Date();
    
    // Format options: 13:11:11 - Sat, 27 Jun 2026
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    
    const timeStr = now.toLocaleTimeString('en-US', timeOptions);
    const dateStr = now.toLocaleDateString('en-US', dateOptions);
    
    clockEl.textContent = `${timeStr} - ${dateStr}`;
}

/**
 * Utility to display UI alerts (toasts)
 */
export function showToast(message, type = 'success') {
    let toast = document.getElementById('alertToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'alertToast';
        toast.className = 'alert-toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `alert-toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
