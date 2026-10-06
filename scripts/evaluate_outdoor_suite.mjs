import fs from 'fs';

const samples = [
  { id: 'oak_leaf', label: 'Oak Leaf Observation', file: 'public/samples/oak_leaf_optimized.jpg' },
  { id: 'tree_bark', label: 'Pine Bark & Lichen', file: 'public/samples/tree_bark_optimized.jpg' },
  { id: 'wildflower', label: 'Dandelion Wildflower', file: 'public/samples/wildflower_optimized.jpg' },
  { id: 'river_stones', label: 'River Stones & Pebbles', file: 'public/samples/river_stones_optimized.jpg' },
  { id: 'pine_cone', label: 'Fallen Pine Cone', file: 'public/samples/pine_cone_optimized.jpg' },
];

async function runEvaluationSuite() {
  console.log('=== Starting TrailLens Real Outdoor Evaluation Suite ===');
  console.log(`Evaluating ${samples.length} real outdoor sample images via local Gemma 3 4B on Ollama...`);
  
  const results = [];

  for (const sample of samples) {
    console.log(`\n----------------------------------------`);
    console.log(`[TESTING] ${sample.label} (${sample.file})`);

    const imageBuffer = fs.readFileSync(sample.file);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, mimeType: 'image/jpeg' }),
      });

      const durationMs = Date.now() - startTime;
      const status = response.status;
      const data = await response.json();

      console.log(`HTTP ${status} in ${durationMs}ms`);
      if (response.ok) {
        console.log(`Identification: "${data.identification}" (Confidence: ${data.confidence})`);
        console.log(`Visual Clues: ${data.evidence?.join('; ')}`);
        console.log(`Challenge: "${data.challenge}"`);
        console.log(`Safety: "${data.safety}"`);
        console.log(`Inference Reported Duration: ${data.inferenceDurationMs}ms`);

        results.push({
          sampleId: sample.id,
          label: sample.label,
          imagePath: sample.file,
          fileSizeKb: Math.round(imageBuffer.length / 1024),
          status: 'SUCCESS',
          httpStatus: status,
          roundtripDurationMs: durationMs,
          inferenceDurationMs: data.inferenceDurationMs,
          identification: data.identification,
          confidence: data.confidence,
          evidence: data.evidence,
          description: data.description,
          observation: data.observation,
          challenge: data.challenge,
          safety: data.safety,
        });
      } else {
        console.error('Error response:', data);
        results.push({
          sampleId: sample.id,
          label: sample.label,
          status: 'FAILED',
          httpStatus: status,
          roundtripDurationMs: durationMs,
          error: data.error || 'Unknown error',
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      results.push({
        sampleId: sample.id,
        label: sample.label,
        status: 'ERROR',
        error: err.message,
      });
    }
  }

  // Save raw empirical results
  fs.mkdirSync('docs', { recursive: true });
  fs.writeFileSync('docs/evaluation_results.json', JSON.stringify(results, null, 2));
  console.log('\n=== Evaluation Suite Completed! ===');
  console.log('Results written to docs/evaluation_results.json');
}

runEvaluationSuite().catch((err) => {
  console.error('Suite failed:', err);
  process.exit(1);
});
