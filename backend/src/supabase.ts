import { createClient } from '@supabase/supabase-js';

const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  throw new Error("SERVICE_ROLE_KEY not set in environment");
}

const isRunningInDocker = process.env.DOCKER === 'true';

const SUPABASE_URL = isRunningInDocker 
  ? 'http://kong:8000' 
  : 'http://localhost:8000';

console.log(`\n💻 Running in ${isRunningInDocker ? 'DOCKER' : 'LOCAL'} mode`);
console.log('\n🌐 Using SUPABASE_URL:', SUPABASE_URL);

export const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const supabaseStorageClient = supabaseClient; 

async function checkBuckets() {
  const { data: buckets, error } = await supabaseStorageClient.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
  } else {
    console.log('\n✅ Buckets connected:', buckets.map((bucket) => { 
      return {
        id: bucket.id, name: bucket.name
      }
    }));
  }
}

checkBuckets();
