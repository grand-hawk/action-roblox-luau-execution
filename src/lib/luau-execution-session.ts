import ky, { RetryOptions } from 'ky';

const retryOptions = {
  limit: 2,
  statusCodes: [408, 413, 429, 502, 503, 504],
} satisfies RetryOptions;

export interface LuauExecutionSessionTaskError {
  code:
    | 'ERROR_CODE_UNSPECIFIED'
    | 'SCRIPT_ERROR'
    | 'DEADLINE_EXCEEDED'
    | 'OUTPUT_SIZE_LIMIT_EXCEEDED'
    | 'INTERNAL_ERROR';
  message: string;
}

export interface LuauExecutionSessionTaskOutput {
  results: unknown[];
}

export interface LuauExecutionSessionTask {
  path: string;
  createTime: string;
  updateTime: string;
  user: string;
  state:
    | 'STATE_UNSPECIFIED'
    | 'QUEUED'
    | 'PROCESSING'
    | 'CANCELLED'
    | 'COMPLETE'
    | 'FAILED';
  script: string;
  error?: LuauExecutionSessionTaskError;
  output?: LuauExecutionSessionTaskOutput;
}

export async function createLuauExecutionSessionTask(
  universeId: string,
  placeId: string,
  script: string,
  apiKey: string,
) {
  return ky
    .post<LuauExecutionSessionTask>(
      `https://apis.roblox.com/cloud/v2/universes/${universeId}/places/${placeId}/luau-execution-session-tasks`,
      {
        json: { script },
        headers: { 'x-api-key': apiKey },
        retry: retryOptions,
      },
    )
    .json();
}

export async function getLuauExecutionSessionTask(
  path: string,
  universeId: string,
  placeId: string,
  apiKey: string,
) {
  return ky
    .get<LuauExecutionSessionTask>(path, {
      prefixUrl: 'https://apis.roblox.com/cloud/v2',
      headers: { 'x-api-key': apiKey },
      retry: retryOptions,
    })
    .json();
}
