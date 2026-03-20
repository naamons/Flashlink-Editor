const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // It'll run in /Users/nathanamons/Documents/ECU Editor/tmp

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function upload() {
  const jsonPath = path.join(__dirname, '../../Map Data/Organized_Maps.json');
  const binPath = path.join(__dirname, '../../Map Data/Veloster N.bin');

  console.log('Uploading JSON...');
  const { data: d1, error: e1 } = await supabase.storage
    .from('demo_files')
    .upload('maps.json', fs.readFileSync(jsonPath), { upsert: true, contentType: 'application/json' });
  
  if (e1) {
    console.error('Error uploading JSON:', e1);
    throw e1;
  }
    
  console.log('Uploading BIN...');
  const { data: d2, error: e2 } = await supabase.storage
    .from('demo_files')
    .upload('data.bin', fs.readFileSync(binPath), { upsert: true, contentType: 'application/octet-stream' });

  if (e2) {
    console.error('Error uploading BIN:', e2);
    throw e2;
  }

  console.log('Done!');
  
  // Print URLs
  const { data: url1 } = supabase.storage.from('demo_files').getPublicUrl('maps.json');
  const { data: url2 } = supabase.storage.from('demo_files').getPublicUrl('data.bin');
  
  console.log('JSON URL:', url1.publicUrl);
  console.log('BIN URL:', url2.publicUrl);
}

upload();
