import fs from 'fs';

async function main() {
  const imageBuffer = fs.readFileSync('public/samples/oak_leaf_optimized.jpg');
  const base64 = imageBuffer.toString('base64');

  console.log(`Testing direct Ollama chat with base64 image (${Math.round(base64.length / 1024)} KB)...`);
  const start = Date.now();

  const res = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:4b',
      messages: [
        {
          role: 'user',
          content: 'Identify this outdoor object and output JSON with keys: identification, confidence, description, challenge.',
          images: [base64],
        },
      ],
      stream: false,
    }),
  });

  const duration = Date.now() - start;
  console.log(`Status: ${res.status} (${duration}ms)`);
  const data = await res.json();
  console.log('Response content:', data.message?.content);
  console.log('Metrics:', {
    total_duration_ms: Math.round(data.total_duration / 1e6),
    prompt_eval_duration_ms: Math.round(data.prompt_eval_duration / 1e6),
    eval_duration_ms: Math.round(data.eval_duration / 1e6),
  });
}

main().catch(console.error);
