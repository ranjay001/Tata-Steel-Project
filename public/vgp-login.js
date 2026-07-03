/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL E-GATEPASS — Login & Registration Client Script
 * Handles authentication actions programmatically (no inline JS).
 * ═══════════════════════════════════════════════════════════════
 */

import { showToast } from './vgp-app.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // ─── Login Form Handler ───
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;
            const loginBtn = document.getElementById('loginBtn');

            if (!userId || !password) {
                showToast('Please enter both User ID and Password.', 'error');
                return;
            }

            try {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Authenticating...';

                const response = await fetch('/api/vgp/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('Login successful! Redirecting...', 'success');
                    localStorage.setItem('vgp_session_token', data.token);
                    localStorage.setItem('vgp_operator', JSON.stringify(data.operator));
                    
                    setTimeout(() => {
                        window.location.href = 'vgp-dashboard.html';
                    }, 800);
                } else {
                    showToast(data.error || 'Authentication failed. Please check credentials.', 'error');
                }
            } catch (err) {
                console.error('[Auth] Login API Error:', err);
                showToast('Network error. Unable to connect to the gate gateway server.', 'error');
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
    }

    // ─── Registration Form Handler ───
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userId = document.getElementById('regUserId').value.trim();
            const fullName = document.getElementById('regFullName').value.trim();
            const assignedGate = document.getElementById('regGate').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const registerBtn = document.getElementById('registerBtn');

            if (!userId || !fullName || !assignedGate || !password || !confirmPassword) {
                showToast('Please fill all mandatory fields.', 'error');
                return;
            }

            if (password.length < 6) {
                showToast('Password must be at least 6 characters long.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showToast('Passwords do not match. Please verify.', 'error');
                return;
            }

            try {
                registerBtn.disabled = true;
                registerBtn.textContent = 'Creating Account...';

                const response = await fetch('/api/vgp/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        fullName,
                        assignedGate,
                        password
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showToast('Account registered successfully! Redirecting to Login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'vgp-login.html';
                    }, 1500);
                } else {
                    showToast(data.error || 'Registration failed. Try a different User ID.', 'error');
                }
            } catch (err) {
                console.error('[Auth] Register API Error:', err);
                showToast('Network error. Unable to connect to server.', 'error');
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
            }
        });
    }
});
