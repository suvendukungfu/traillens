import fs from 'fs';

async function testAnalyze() {
  console.log('Reading sample image...');
  const imageBuffer = fs.readFileSync('public/samples/oak_leaf_optimized.jpg');
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  console.log(`Sending image (${Math.round(imageBuffer.length / 1024)} KB) to http://localhost:3000/api/analyze...`);
  const startTime = Date.now();

  const response = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, mimeType: 'image/jpeg' }),
  });

  const durationMs = Date.now() - startTime;
  console.log(`HTTP Status: ${response.status} (took ${durationMs}ms)`);

  const data = await response.json();
  console.log('Structured AI Response:');
  console.log(JSON.stringify(data, null, 2));

  if (!response.ok) {
    process.exit(1);
  }
}

testAnalyze().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
