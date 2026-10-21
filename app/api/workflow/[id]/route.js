import { jsonErr, jsonOk } from '../../../../lib/server-rpc.mjs';
import { readVerifiedFinal, validWorkflowId } from '../../../../lib/finalized-workflow-read.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!validWorkflowId(id)) return jsonErr(new Error('Workflow ID must use 1–96 letters, numbers, hyphens, underscores, colons, or dots.'), 400);
  try {
    const { value: workflow, snapshot } = await readVerifiedFinal('get_workflow', [id]);
    if (workflow?.schema !== snapshot.schema || workflow?.workflow_id !== id) throw new Error('Finalized workflow record does not match the requested ID and schema.');
    return jsonOk({ workflow, source: 'LATEST_FINAL', schemaVerified: true });
  } catch (error) { return jsonErr(error); }
}
