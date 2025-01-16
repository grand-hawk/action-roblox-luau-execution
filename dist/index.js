// src/index.ts
import * as core from "@actions/core";
import * as path from "node:path";
import * as fs from "node:fs";

// src/lib/luau-execution-session.ts
import ky from "ky";
var retryOptions = {
  limit: 2,
  statusCodes: [408, 413, 429, 502, 503, 504]
};
async function createLuauExecutionSessionTask(universeId, placeId, script, apiKey) {
  return ky.post(
    `https://apis.roblox.com/cloud/v2/universes/${universeId}/places/${placeId}/luau-execution-session-tasks`,
    {
      json: { script },
      headers: { "x-api-key": apiKey },
      retry: retryOptions
    }
  ).json();
}
async function getLuauExecutionSessionTask(path2, universeId, placeId, apiKey) {
  return ky.get(path2, {
    prefixUrl: "https://apis.roblox.com/cloud/v2",
    headers: { "x-api-key": apiKey },
    retry: retryOptions
  }).json();
}

// src/index.ts
import { setTimeout } from "node:timers/promises";
async function run() {
  try {
    const apiKey = core.getInput("roblox_api_key", { required: true });
    const universeId = core.getInput("universe_id", { required: true });
    const placeId = core.getInput("place_id", { required: true });
    const luauFile = core.getInput("luau_file", { required: true });
    const outputFile = core.getInput("output_file");
    const dumpToSummary = core.getBooleanInput("dump_to_summary") ?? false;
    const luauFilePath = path.resolve(luauFile);
    const outputFilePath = outputFile && path.resolve(outputFile);
    if (!fs.existsSync(luauFilePath)) {
      throw new Error('File path from "luau_file" does not exist');
    }
    const script = await fs.promises.readFile(luauFilePath, "utf-8");
    const createdTask = await createLuauExecutionSessionTask(
      universeId,
      placeId,
      script,
      apiKey
    );
    let lastKnownState = createdTask.state;
    while (await setTimeout(3500, true)) {
      const taskResult = await getLuauExecutionSessionTask(
        createdTask.path,
        universeId,
        placeId,
        apiKey
      );
      if (taskResult.state === lastKnownState) {
        continue;
      }
      lastKnownState = taskResult.state;
      core.info(`Task state updated: "${taskResult.state}"`);
      switch (taskResult.state) {
        case "CANCELLED": {
          throw new Error(`Task cancelled`);
        }
        case "COMPLETE": {
          if (taskResult.output) {
            const stringifiedOutput = JSON.stringify(taskResult.output.results);
            core.setOutput("results", stringifiedOutput);
            if (outputFilePath) {
              fs.promises.mkdir(path.dirname(outputFilePath), {
                recursive: true
              });
              await fs.promises.writeFile(outputFilePath, stringifiedOutput);
              core.info(`Wrote output to "${outputFilePath}"`);
            } else {
              core.info(`No output file specified`);
            }
            if (dumpToSummary) {
              await core.summary.addCodeBlock(
                JSON.stringify(taskResult.output.results, void 0, 4),
                "json"
              ).write();
              core.info(`Dumped output to summary`);
            }
          } else {
            core.warning("Task completed without output");
          }
          return;
        }
        case "FAILED": {
          const error = taskResult.error;
          if (!error) {
            throw new Error("Task failed without error");
          } else {
            throw new Error(
              `Task failed with code: "${error.code}"
${error.message}`
            );
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
run();
