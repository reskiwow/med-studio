import "server-only";

/**
 * IMPORTANT — read before touching this file.
 *
 * This wraps Roblox's Open Cloud "Assets" API, which is the documented,
 * public way to upload an asset (including Audio) on behalf of a Creator
 * or a Group, using an API key with the appropriate scopes:
 *   POST https://apis.roblox.com/assets/v1/assets
 *   GET  https://apis.roblox.com/assets/v1/{operation.path}   (operation status)
 *
 * [Medium confidence — this needs verification against Roblox's current
 * Open Cloud reference before going live: exact request/response shapes,
 * required scopes, and whether audio moderation status is exposed via this
 * same operation object or requires a separate call. Roblox's API surface
 * and moderation pipeline are not something to hardcode from memory in a
 * production integration — check https://create.roblox.com/docs/cloud
 * at implementation time.]
 *
 * Rules enforced by this file's design:
 * - No endpoint is called that isn't part of the documented Open Cloud API.
 * - No moderation result is ever invented. If Roblox's response doesn't
 *   contain a final result, we return `PROCESSING`/`PENDING` and tell the
 *   caller to poll again later — never `SUCCESS` or `REJECTED` as a guess.
 * - Credentials are only ever decrypted here, right before the call, and
 *   are never returned in this module's output.
 */

const ASSETS_BASE = process.env.ROBLOX_API_BASE_URL ?? "https://apis.roblox.com";

export type RobloxTarget =
  | { type: "CREATOR"; robloxUserId: string }
  | { type: "GROUP"; robloxGroupId: string };

export interface RobloxUploadResult {
  // Roblox returns an Operation while moderation is pending.
  operationPath: string | null;
  assetId: string | null;
  status: "PENDING" | "SUCCESS" | "REJECTED" | "FAILED";
  raw: unknown;
}

export async function uploadAudioAsset(params: {
  apiKey: string;
  target: RobloxTarget;
  displayName: string;
  description: string;
  fileBuffer: Buffer;
  fileName: string;
}): Promise<RobloxUploadResult> {
  const creationContext =
    params.target.type === "CREATOR"
      ? { creator: { userId: params.target.robloxUserId } }
      : { creator: { groupId: params.target.robloxGroupId } };

  const requestPayload = {
    assetType: "Audio",
    displayName: params.displayName,
    description: params.description,
    creationContext,
  };

  const form = new FormData();
  form.append("request", JSON.stringify(requestPayload));
  form.append(
    "fileContent",
    new Blob([params.fileBuffer], { type: "audio/mpeg" }),
    params.fileName
  );

  const res = await fetch(`${ASSETS_BASE}/assets/v1/assets`, {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
    },
    body: form,
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    return { operationPath: null, assetId: null, status: "FAILED", raw };
  }

  // Open Cloud returns a long-running Operation while the asset is created
  // and moderated. We surface it as PENDING until polled to a terminal state.
  const operationPath: string | null = raw?.path ?? null;
  const done: boolean = raw?.done ?? false;

  if (done && raw?.response?.assetId) {
    return { operationPath, assetId: raw.response.assetId, status: "SUCCESS", raw };
  }
  if (done && raw?.error) {
    return { operationPath, assetId: null, status: "REJECTED", raw };
  }

  return { operationPath, assetId: null, status: "PENDING", raw };
}

export async function pollAssetOperation(params: {
  apiKey: string;
  operationPath: string;
}): Promise<RobloxUploadResult> {
  const res = await fetch(`${ASSETS_BASE}/assets/v1/${params.operationPath.replace(/^\/?assets\/v1\//, "")}`, {
    headers: { "x-api-key": params.apiKey },
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    return { operationPath: params.operationPath, assetId: null, status: "FAILED", raw };
  }

  const done: boolean = raw?.done ?? false;
  if (done && raw?.response?.assetId) {
    return { operationPath: params.operationPath, assetId: raw.response.assetId, status: "SUCCESS", raw };
  }
  if (done && raw?.error) {
    return { operationPath: params.operationPath, assetId: null, status: "REJECTED", raw };
  }

  return { operationPath: params.operationPath, assetId: null, status: "PENDING", raw };
}

/**
 * TODO (do not fabricate): Roblox does not publicly document a way to fetch
 * a human-readable moderation rejection reason for Audio assets beyond what
 * the Operation error payload contains. If/when Roblox documents this,
 * surface `raw.error.message` verbatim to the user instead of guessing.
 */
