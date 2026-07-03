/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL E-GATEPASS — New Gate Pass Creator Client Script
 * Binds form submissions programmatically.
 * ═══════════════════════════════════════════════════════════════
 */

import { initSharedFeatures, API_URL, showToast } from './vgp-app.js';

document.addEventListener('DOMContentLoaded', () => {
    // Auth check & shared elements setup
    const operator = initSharedFeatures('menuNewPass');
    if (!operator) return;

    // Prefill operator's assigned gate as entry gate default
    const operatorObj = JSON.parse(localStorage.getItem('vgp_operator'));
    if (operatorObj && operatorObj.assigned_gate) {
        const gateSelect = document.getElementById('vGate');
        if (gateSelect) {
            gateSelect.value = operatorObj.assigned_gate;
        }
    }

    const passForm = document.getElementById('passForm');
    if (passForm) {
        passForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('vName').value.trim();
            const phone = document.getElementById('vPhone').value.trim();
            const company = document.getElementById('vCompany').value.trim();
            const host = document.getElementById('vHost').value.trim();
            const dept = document.getElementById('vDept').value;
            const purpose = document.getElementById('vPurpose').value;
            const idType = document.getElementById('vIdType').value;
            const idNum = document.getElementById('vIdNum').value.trim();
            const vehicle = document.getElementById('vVehicle').value.trim();
            const gate = document.getElementById('vGate').value;
            const generateBtn = document.getElementById('generateBtn');

            // Pre-submit validation
            if (!name || !phone || !company || !host || !dept || !purpose || !idType || !idNum || !gate) {
                showToast('All required fields must be filled.', 'error');
                return;
            }

            if (!/^[0-9]{10}$/.test(phone)) {
                showToast('Contact number must be a valid 10-digit number.', 'error');
                return;
            }

            const payload = {
                visitor_name: name,
                phone: phone,
                company: company,
                host_name: host,
                department: dept,
                purpose: purpose,
                id_proof_type: idType,
                id_proof_number: idNum,
                vehicle_number: vehicle || null,
                entry_gate: gate
            };

            try {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generating Pass...';

                const response = await fetch(`${API_URL}/pass`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showToast(`✅ Pass ${result.pass_number} generated for ${name}!`, 'success');
                    
                    // Reset form and prefill gate again
                    passForm.reset();
                    if (operatorObj && operatorObj.assigned_gate && gateSelect) {
                        gateSelect.value = operatorObj.assigned_gate;
                    }
                } else {
                    showToast(result.error || 'Failed to generate gate pass.', 'error');
                }
            } catch (err) {
                console.error('[New Pass] API Error:', err);
                showToast('Network error while saving pass.', 'error');
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Pass';
            }
        });
    }
});
