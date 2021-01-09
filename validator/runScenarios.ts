import { logToConsole } from "@opah/host";
import { concurrentMap } from "../axax/concurrentMap.ts";
import { merge } from "../axax/merge.ts";
import { executeClosureInContext } from "../opah/executeClosureInContext.ts";
import { inMemoryHost } from "../in_memory_host/$.ts";
import { replaceInClosure } from "../replaceDefinitions/replaceInClosure.ts";
import { Scenario } from "./scenario.ts";
import { watchScenario } from "./watchScenario.ts";

export async function runScenarios(
  scenarios: Array<Scenario>,
  replacements = inMemoryHost
) {
  await concurrentMap(async (scenario: Scenario) => {
    logToConsole("🏃", scenario.description);
    try {
      const [inMemoryClosure, artificialDefinitions] = await replaceInClosure(
        scenario.verify,
        replacements
      );
      const inMemoryVerifyFn = await executeClosureInContext(
        inMemoryClosure,
        artificialDefinitions
      );

      await inMemoryVerifyFn();

      logToConsole(`✅  ${scenario.description}`);
    } catch (err) {
      logToConsole(`❌  ${scenario.description}`);
      logToConsole();
      logToConsole(err);
      logToConsole();
    }
  }, 10)(merge(...scenarios.map((scenario) => watchScenario(scenario))));
}
