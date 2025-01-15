import * as core from '@actions/core';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  createLuauExecutionSessionTask,
  getLuauExecutionSessionTask,
} from './lib/luau-execution-session';
import { setTimeout } from 'node:timers/promises';

async function run() {
  try {
    const apiKey = core.getInput('roblox_api_key');
    const universeId = core.getInput('universe_id');
    const placeId = core.getInput('place_id');
    const luauFile = core.getInput('luau_file');
    const outputFile: string | undefined = core.getInput('output_file');

    const luauFilePath = path.resolve(luauFile);
    const outputFilePath = outputFile && path.resolve(outputFile);

    if (!fs.existsSync(luauFilePath)) {
      throw new Error('File path from "luau_file" does not exist');
    }

    const script = await fs.promises.readFile(luauFilePath, 'utf-8');

    const createdTask = await createLuauExecutionSessionTask(
      universeId,
      placeId,
      script,
      apiKey,
    );

    let lastKnownState = createdTask.state;
    while (await setTimeout(3_500, true)) {
      const taskResult = await getLuauExecutionSessionTask(
        createdTask.path,
        universeId,
        placeId,
        apiKey,
      );

      // state hasn't changed, wait for next poll
      if (taskResult.state === lastKnownState) {
        continue;
      }
      lastKnownState = taskResult.state;

      core.info(`Task state updated: "${taskResult.state}"`);

      switch (taskResult.state) {
        case 'CANCELLED': {
          throw new Error(`Task cancelled`);
        }

        case 'COMPLETE': {
          if (taskResult.output) {
            if (outputFilePath) {
              fs.promises.mkdir(path.dirname(outputFilePath), {
                recursive: true,
              });

              await fs.promises.writeFile(
                outputFilePath,
                JSON.stringify(taskResult.output.results),
              );

              core.info(`Wrote output to "${outputFilePath}"`);
            } else {
              core.info(`No output file specified`);
            }
          } else {
            core.warning('Task completed without output');
          }
          return;
        }

        case 'FAILED': {
          const error = taskResult.error;
          if (!error) {
            throw new Error('Task failed without error');
          } else {
            throw new Error(
              `Task failed with code: "${error.code}"` + `\n${error.message}`,
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
