const supabase = require('./supabase');

async function test() {
  try {
    const passNumber = `VGP-TEST-${Date.now()}`;
    const { data, error } = await supabase
      .from('visitor_gate_pass')
      .insert([{
        pass_number: passNumber,
        visitor_name: 'Test Visitor',
        phone: '1234567890',
        company: 'Test Company',
        host_name: 'Test Host',
        department: 'Engineering',
        purpose: 'Official Meeting',
        id_proof_type: 'Aadhaar Card',
        id_proof_number: '1234-5678-9012',
        entry_gate: 'Main Gate',
        punch_type: 'IN'
      }])
      .select();

    if (error) {
      console.error('Supabase error inserting pass:', error);
    } else {
      console.log('Successfully inserted pass into visitor_gate_pass:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();