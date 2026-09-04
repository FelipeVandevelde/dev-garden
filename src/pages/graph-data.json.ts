import { generateGraphData } from '../utils/graph';

export async function GET() {
  const data = await generateGraphData();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
