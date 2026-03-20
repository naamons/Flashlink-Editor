import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env variables passed via --env-file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const __dirname = path.resolve();

async function upload() {
  const jsonPath = path.join(__dirname, 'Map Data/Organized_Maps.json');
  const binPath = path.join(__dirname, 'Map Data/Veloster N.bin');

  console.log('Uploading JSON...', jsonPath);
  const { data: d1, error: e1 } = await supabase.storage
    .from('demo_files')
    .upload('maps.json', fs.readFileSync(jsonPath), { upsert: true, contentType: 'application/json' });
  
  if (e1) {
    console.error('Error uploading JSON:', e1);
    throw e1;
  }
    
  console.log('Uploading BIN...', binPath);
  const { data: d2, error: e2 } = await supabase.storage
    .from('demo_files')
    .upload('data.bin', fs.readFileSync(binPath), { upsert: true, contentType: 'application/octet-stream' });

  if (e2) {
    console.error('Error uploading BIN:', e2);
    throw e2;
  }

  console.log('Done!');
  
  const url1 = supabase.storage.from('demo_files').getPublicUrl('maps.json').data;
  const url2 = supabase.storage.from('demo_files').getPublicUrl('data.bin').data;
  
  console.log('JSON URL:', url1.publicUrl);
  console.log('BIN URL:', url2.publicUrl);
}

upload();
