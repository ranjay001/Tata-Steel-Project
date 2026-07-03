/**
 * ═══════════════════════════════════════════════════════════════
 * TATA STEEL — Unified Node.js Express Server
 *
 * Serves both:
 *   1. Canteen Control System (existing t_vendor_attendance)
 *   2. E-GatePass Visitor Management System (new tables/routes)
 *
 * Backend API Gateway with Supabase (PostgreSQL) integration.
 * ═══════════════════════════════════════════════════════════════
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const supabase = require('./supabase'); // Supabase client initialization

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware Stack ───
app.use(cors());                                      
app.use(express.json());                               
app.use(express.urlencoded({ extended: true }));       
app.use(express.static(path.resolve(__dirname, 'public'))); 


// ═══════════════════════════════════════════════════════════════
// PAGE ROUTING (HTML Files)
// ═══════════════════════════════════════════════════════════════

// Existing Canteen routes
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'dashboard.html'));
});
app.get('/punch.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'punch.html'));
});

// New E-GatePass routes
app.get('/vgp-login', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-login.html'));
});
app.get('/vgp-login.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-login.html'));
});
app.get('/vgp-register', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-register.html'));
});
app.get('/vgp-register.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-register.html'));
});
app.get('/vgp-dashboard', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-dashboard.html'));
});
app.get('/vgp-dashboard.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-dashboard.html'));
});
app.get('/vgp-new-pass', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-new-pass.html'));
});
app.get('/vgp-new-pass.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-new-pass.html'));
});
app.get('/vgp-checkout', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-checkout.html'));
});
app.get('/vgp-checkout.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-checkout.html'));
});
app.get('/vgp-log', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-log.html'));
});
app.get('/vgp-log.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vgp-log.html'));
});


// ═══════════════════════════════════════════════════════════════
// EXISTING CANTEEN SYSTEM ENDPOINTS (UNTOUCHED)
// ═══════════════════════════════════════════════════════════════

app.post('/api/login', (req, res) => {
    const { userid, password } = req.body;
    if (userid === 'admin24' && password === '123456') {
        return res.json({ success: true, role: 'CCS', redirect: '/dashboard.html' });
    }
    return res.status(401).json({ success: false, message: 'Invalid Credentials' });
});

app.get('/api/analytics', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('t_vendor_attendance')
            .select('*')
            .eq('tva_date', today);

        if (error) throw error;

        const totalLogs = data ? data.length : 0;
        const uniqueSpMap = new Map();
        if (data) {
            data.forEach(r => uniqueSpMap.set(r.tva_sp_no, r.tva_flag));
        }
        
        const currentIn = Array.from(uniqueSpMap.values()).filter(status => status === 'In').length;
        const totalOut = data ? data.filter(r => r.tva_flag === 'Out').length : 0;

        res.json({ totalLogs, currentIn, totalOut, rawLogs: data || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/punch', async (req, res) => {
    try {
        const { tva_sp_no, tva_can_id, tva_loc_id, tva_meal_id, tva_trolley_point, tva_flag } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const { data: previousPunches, error: fetchErr } = await supabase
            .from('t_vendor_attendance')
            .select('tva_flag')
            .eq('tva_sp_no', tva_sp_no)
            .eq('tva_date', today)
            .order('tva_punch_time', { ascending: false })
            .limit(1);

        if (fetchErr) throw fetchErr;

        const lastStatus = previousPunches && previousPunches.length > 0 ? previousPunches[0].tva_flag : null;

        if (tva_flag === 'In' && lastStatus === 'In') {
            return res.status(400).json({ success: false, message: 'Vendor already Punched-In! Exits required first.' });
        }
        if (tva_flag === 'Out' && lastStatus !== 'In') {
            return res.status(400).json({ success: false, message: 'Cannot register execution without active entry stamp.' });
        }

        const { error } = await supabase
            .from('t_vendor_attendance')
            .insert([{
                tva_sp_no, tva_can_id, tva_loc_id, tva_meal_id, tva_trolley_point, tva_flag, tva_date: today
            }]);

        if (error) throw error;
        return res.json({ success: true, message: `Punch-${tva_flag} registered successfully!` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});


// ═══════════════════════════════════════════════════════════════
// NEW E-GATEPASS VISITOR MANAGEMENT API ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// ─── 1. OPERATOR AUTHENTICATION ───

/**
 * Register Operator Account
 * POST /api/vgp/register
 */
app.post('/api/vgp/register', async (req, res) => {
    const { userId, fullName, assignedGate, password } = req.body;

    if (!userId || !fullName || !assignedGate || !password) {
        return res.status(400).json({ success: false, error: 'Missing mandatory registration fields.' });
    }

    try {
        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('gate_operators')
            .insert([{
                user_id: userId.trim().toLowerCase(),
                full_name: fullName.trim(),
                assigned_gate: assignedGate,
                password_hash: passwordHash
            }])
            .select();

        if (error) {
            // Handle unique constraint error on user_id
            if (error.code === '23505') {
                return res.status(400).json({ success: false, error: 'User ID is already registered.' });
            }
            throw error;
        }

        return res.status(201).json({ success: true, message: 'Operator registered successfully.' });
    } catch (err) {
        console.error('[Backend] Operator registration error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Operator Login
 * POST /api/vgp/login
 */
app.post('/api/vgp/login', async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ success: false, error: 'User ID and password are required.' });
    }

    try {
        const { data: operator, error } = await supabase
            .from('gate_operators')
            .select('*')
            .eq('user_id', userId.trim().toLowerCase())
            .single();

        if (error || !operator) {
            return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
        }

        // Compare password hash
        const isMatch = await bcrypt.compare(password, operator.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid User ID or Password.' });
        }

        // Generate simple unique token for session tracking
        const sessionToken = 'VGP-TOKEN-' + Math.random().toString(36).substring(2) + Date.now().toString(36);

        return res.json({
            success: true,
            token: sessionToken,
            operator: {
                id: operator.id,
                user_id: operator.user_id,
                full_name: operator.full_name,
                assigned_gate: operator.assigned_gate
            }
        });
    } catch (err) {
        console.error('[Backend] Operator login error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});


// ─── 2. GATE PASS OPERATIONS ───

/**
 * Generate New Gate Pass
 * POST /api/vgp/pass
 */
app.post('/api/vgp/pass', async (req, res) => {
    const {
        visitor_name, phone, company, host_name, department,
        purpose, id_proof_type, id_proof_number, vehicle_number, entry_gate
    } = req.body;

    if (!visitor_name || !phone || !company || !host_name || !department || !purpose || !id_proof_type || !id_proof_number || !entry_gate) {
        return res.status(400).json({ success: false, error: 'Mandatory field(s) missing.' });
    }

    try {
        // Generate pass_number format: VGP-YYYYMMDD-XXXX (Random 4-digit code)
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const passNumber = `VGP-${dateStr}-${randomCode}`;

        const { data, error } = await supabase
            .from('visitor_gate_pass')
            .insert([{
                pass_number: passNumber,
                visitor_name: visitor_name.trim(),
                phone: phone.trim(),
                company: company.trim(),
                host_name: host_name.trim(),
                department: department,
                purpose: purpose,
                id_proof_type: id_proof_type,
                id_proof_number: id_proof_number.trim(),
                vehicle_number: vehicle_number ? vehicle_number.trim().toUpperCase() : null,
                entry_gate: entry_gate,
                punch_type: 'IN',
                checked_in_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            pass_number: passNumber,
            data: data[0]
        });
    } catch (err) {
        console.error('[Backend] Pass generation error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Fetch All Currently Inside Visitors
 * GET /api/vgp/active
 */
app.get('/api/vgp/active', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('visitor_gate_pass')
            .select('*')
            .eq('punch_type', 'IN')
            .order('checked_in_at', { ascending: false });

        if (error) throw error;

        return res.json(data || []);
    } catch (err) {
        console.error('[Backend] Fetch active error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * Check Out Visitor (Sets Status to 'OUT')
 * POST /api/vgp/checkout
 */
app.post('/api/vgp/checkout', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, error: 'Visitor ID is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('visitor_gate_pass')
            .update({
                punch_type: 'OUT',
                checked_out_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('punch_type', 'IN') // Guard: Only checkout if they are currently inside
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, error: 'Visitor is already checked out or does not exist.' });
        }

        return res.json({ success: true, message: 'Checked out successfully.', data: data[0] });
    } catch (err) {
        console.error('[Backend] Check-out error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});


// ─── 3. ANALYTICS & DASHBOARD ───

/**
 * Get Dashboard Telemetry Stats
 * GET /api/vgp/dashboard
 */
app.get('/api/vgp/dashboard', async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayStartISO = todayStart.toISOString();

        // 1. Fetch all records created today
        const { data: todayRecords, error: errToday } = await supabase
            .from('visitor_gate_pass')
            .select('*')
            .gte('checked_in_at', todayStartISO);

        if (errToday) throw errToday;

        const passesToday = todayRecords ? todayRecords.length : 0;
        
        // 2. Fetch all currently inside (punch_type = 'IN')
        const { data: insideRecords, error: errInside } = await supabase
            .from('visitor_gate_pass')
            .select('id')
            .eq('punch_type', 'IN');

        if (errInside) throw errInside;

        const currentlyInside = insideRecords ? insideRecords.length : 0;

        // 3. Count exited today (punch_type = 'OUT' and checked_out_at >= todayStart)
        const exitedToday = todayRecords ? todayRecords.filter(r => r.punch_type === 'OUT').length : 0;

        // 4. Calculate Passes by Gate (breakdown for Main Gate, Gate 2, Gate 3, Gate 4)
        const gateCounts = {
            'Main Gate': 0,
            'Gate 2': 0,
            'Gate 3': 0,
            'Gate 4': 0
        };

        if (todayRecords) {
            todayRecords.forEach(r => {
                if (gateCounts[r.entry_gate] !== undefined) {
                    gateCounts[r.entry_gate]++;
                }
            });
        }

        // 5. Fetch Recent Activity (last 5 checks sorted by time desc)
        // We will fetch last 5 rows ordered by checked_out_at or checked_in_at.
        // For simplicity, we query the visitor log table for last 5 logs.
        const { data: recentLogs, error: errRecent } = await supabase
            .from('visitor_gate_pass')
            .select('*')
            .order('checked_in_at', { ascending: false })
            .limit(5);

        if (errRecent) throw errRecent;

        const recentActivity = [];
        if (recentLogs) {
            recentLogs.forEach(r => {
                // If exited, show checkout activity first
                if (r.punch_type === 'OUT' && r.checked_out_at) {
                    recentActivity.push({
                        visitor_name: r.visitor_name,
                        action: 'EXIT',
                        host_name: r.host_name,
                        timestamp: r.checked_out_at,
                        gate: r.entry_gate
                    });
                }
                
                // Show entry activity
                recentActivity.push({
                    visitor_name: r.visitor_name,
                    action: 'ENTRY',
                    host_name: r.host_name,
                    timestamp: r.checked_in_at,
                    gate: r.entry_gate
                });
            });
        }

        // Sort by timestamp desc and slice to top 5
        recentActivity.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        const slicedActivity = recentActivity.slice(0, 5);

        return res.json({
            passesToday,
            currentlyInside,
            exitedToday,
            gateCounts,
            recentActivity: slicedActivity
        });
    } catch (err) {
        console.error('[Backend] Dashboard stats error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});


// ─── 4. HISTORY LOGS & EXPORT ───

/**
 * Fetch Filtered Visitor Log Database
 * GET /api/vgp/log
 */
app.get('/api/vgp/log', async (req, res) => {
    const { from, to, gate, status, search } = req.query;

    try {
        let query = supabase
            .from('visitor_gate_pass')
            .select('*');

        // Apply Date Filters (inclusive of selected days)
        if (from) {
            const startDate = new Date(from);
            startDate.setHours(0,0,0,0);
            query = query.gte('checked_in_at', startDate.toISOString());
        }
        if (to) {
            const endDate = new Date(to);
            endDate.setHours(23,59,59,999);
            query = query.lte('checked_in_at', endDate.toISOString());
        }

        // Apply Gate Filter
        if (gate) {
            query = query.eq('entry_gate', gate);
        }

        // Apply Status Filter (IN / OUT)
        if (status) {
            query = query.eq('punch_type', status);
        }

        // Order results
        query = query.order('checked_in_at', { ascending: false });

        const { data: records, error } = await query;
        if (error) throw error;

        // Apply Client-side search filters to avoid SQL injection
        let filteredRecords = records || [];
        if (search) {
            const sq = search.toLowerCase();
            filteredRecords = filteredRecords.filter(r => 
                r.visitor_name.toLowerCase().includes(sq) ||
                r.phone.toLowerCase().includes(sq) ||
                r.pass_number.toLowerCase().includes(sq) ||
                r.host_name.toLowerCase().includes(sq) ||
                (r.company && r.company.toLowerCase().includes(sq))
            );
        }

        // Calculate summary statistics for filtered dataset
        const total = filteredRecords.length;
        const inside = filteredRecords.filter(r => r.punch_type === 'IN').length;
        const exited = filteredRecords.filter(r => r.punch_type === 'OUT').length;

        return res.json({
            stats: { total, inside, exited },
            records: filteredRecords
        });
    } catch (err) {
        console.error('[Backend] Fetch logs error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * Stream Filtered Logs as Downloadable CSV file
 * GET /api/vgp/export
 */
app.get('/api/vgp/export', async (req, res) => {
    const { from, to, gate, status, search } = req.query;

    try {
        let query = supabase.from('visitor_gate_pass').select('*');

        if (from) {
            const startDate = new Date(from);
            startDate.setHours(0,0,0,0);
            query = query.gte('checked_in_at', startDate.toISOString());
        }
        if (to) {
            const endDate = new Date(to);
            endDate.setHours(23,59,59,999);
            query = query.lte('checked_in_at', endDate.toISOString());
        }
        if (gate) {
            query = query.eq('entry_gate', gate);
        }
        if (status) {
            query = query.eq('punch_type', status);
        }

        query = query.order('checked_in_at', { ascending: false });

        const { data: records, error } = await query;
        if (error) throw error;

        // Filter search term
        let filteredRecords = records || [];
        if (search) {
            const sq = search.toLowerCase();
            filteredRecords = filteredRecords.filter(r => 
                r.visitor_name.toLowerCase().includes(sq) ||
                r.phone.toLowerCase().includes(sq) ||
                r.pass_number.toLowerCase().includes(sq) ||
                r.host_name.toLowerCase().includes(sq) ||
                (r.company && r.company.toLowerCase().includes(sq))
            );
        }

        // Generate CSV content
        let csvContent = 'Pass Number,Visitor Name,Phone,Company,Whom to Meet,Entry Gate,Checked In,Checked Out,Status\n';
        
        filteredRecords.forEach(r => {
            const escapeCSV = (str) => {
                if (!str) return '';
                // Double-quotes escape rule
                return `"${str.replace(/"/g, '""')}"`;
            };
            
            const formatTime = (timeStr) => {
                if (!timeStr) return '';
                return new Date(timeStr).toLocaleString('en-IN');
            };

            csvContent += `${escapeCSV(r.pass_number)},`;
            csvContent += `${escapeCSV(r.visitor_name)},`;
            csvContent += `${escapeCSV(r.phone)},`;
            csvContent += `${escapeCSV(r.company)},`;
            csvContent += `${escapeCSV(r.host_name)},`;
            csvContent += `${escapeCSV(r.entry_gate)},`;
            csvContent += `${formatTime(r.checked_in_at)},`;
            csvContent += `${formatTime(r.checked_out_at)},`;
            csvContent += `"${r.punch_type}"\n`;
        });

        // Set response headers for file streaming download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="visitor_log_export.csv"');
        return res.send(csvContent);

    } catch (err) {
        console.error('[Backend] Export error:', err.message);
        return res.status(500).send('Error generating export file: ' + err.message);
    }
});


// ═══════════════════════════════════════════════════════════════
// SERVER STARTUP & TABLE CONNECTIONS VERIFICATION
// ═══════════════════════════════════════════════════════════════

const serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n══════════════════════════════════════════════════════`);
    console.log(`🚀 Tata Steel Unified Server operating on port ${PORT}`);
    console.log(`══════════════════════════════════════════════════════`);
    console.log(`🛡️  E-GatePass Login:    http://localhost:${PORT}/vgp-login.html`);
    console.log(`📊 E-GatePass Dashboard:http://localhost:${PORT}/vgp-dashboard.html`);
    console.log(`📊 CCS Canteen System:  http://localhost:${PORT}/dashboard.html`);
    console.log(`══════════════════════════════════════════════════════`);

    // Verify connectivity to the new Supabase VGP schema tables
    (async () => {
        try {
            // Check gate_operators table
            const { error: errOp } = await supabase.from('gate_operators').select('id').limit(1);
            if (errOp) {
                console.log(`❌ Table gate_operators not found or not accessible: ${errOp.message}`);
            } else {
                console.log(`✅ Supabase Table verified: gate_operators`);
            }

            // Check visitor_gate_pass table
            const { error: errPass } = await supabase.from('visitor_gate_pass').select('id').limit(1);
            if (errPass) {
                console.log(`❌ Table visitor_gate_pass not found or not accessible: ${errPass.message}`);
            } else {
                console.log(`✅ Supabase Table verified: visitor_gate_pass`);
            }
        } catch (e) {
            console.log(`❌ Error connecting to Supabase database schema: ${e.message}`);
        }
        console.log(`══════════════════════════════════════════════════════`);
    })();
});

// Prevent immediate crash fallback on exceptions
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught System Exception caught:', err);
});