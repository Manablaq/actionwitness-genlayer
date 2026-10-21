import { jsonErr, jsonOk } from '../../../../lib/server-rpc.mjs';
import { readVerifiedFinal, validWorkflowId } from '../../../../lib/finalized-workflow-read.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!validWorkflowId(id)) return jsonErr(new Error('Policy ID must use 1–96 letters, numbers, hyphens, underscores, colons, or dots.'), 400);
  try {
    const { value: policy } = await readVerifiedFinal('get_policy', [id]);
    if (!policy || typeof policy !== 'object' || Array.isArray(policy)) throw new Error('Finalized policy record is malformed.');
    return jsonOk({ exists: true, source: 'LATEST_FINAL', schemaVerified: true });
  } catch (error) { return jsonErr(error); }
}
