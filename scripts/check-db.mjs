import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

// Check agencies table
const { data: agencies, error: agErr } = await supabase.from('agencies').select('id, name, slug').limit(5);
console.log('AGENCIES:', agErr ? 'ERROR: ' + agErr.message : JSON.stringify(agencies, null, 2));

// Check agency_users table
const { data: agUsers, error: auErr } = await supabase.from('agency_users').select('id, email, role').limit(5);
console.log('AGENCY_USERS:', auErr ? 'ERROR: ' + auErr.message : JSON.stringify(agUsers, null, 2));

// Check tenants table
const { data: tenants, error: tErr } = await supabase.from('tenants').select('id, name, slug, agency_id').limit(5);
console.log('TENANTS:', tErr ? 'ERROR: ' + tErr.message : JSON.stringify(tenants, null, 2));

// Check auth users
const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers({ perPage: 5 });
console.log('AUTH_USERS:', uErr ? 'ERROR: ' + uErr.message : users?.map(u => u.email));
