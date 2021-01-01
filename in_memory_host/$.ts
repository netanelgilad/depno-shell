import {
  arrowFunctionExpression,
  blockStatement,
  CanonicalName,
  expressionStatement,
  identifier,
  Identifier,
  ImportSpecifier,
  isImportDeclaration,
  objectPattern,
  objectProperty,
  Program,
  program,
  variableDeclaration,
  variableDeclarator,
} from "@depno/core";
import { executeProgram, forkProgram } from "@depno/host";
import { Map } from "@depno/immutable";
import { EventEmitter } from "events";
import { readFileSync, writeFileSync } from "fs";
import { PassThrough } from "stream";
import { canonicalIdentifier } from "../depno/executeExpressionWithScope/getExecutionProgramForDefinition/canonicalIdentifier.ts";
import { canonicalName } from "../macros/canonicalName.ts";
import { definition } from "../macros/definition.ts";

export const inMemoryHost = Map([
  [
    canonicalName(writeFileSync),
    definition((path: string, contents: string) => {
      FilesystemState.filesystem = FilesystemState.filesystem.set(
        path,
        contents
      );
    }),
  ],
  [
    canonicalName(readFileSync),
    definition((path: string) => {
      return FilesystemState.filesystem.get(path);
    }),
  ],
  [
    canonicalName(forkProgram),
    definition((executionProgram: Program, cwd: string) => {
      const replcaedStatements = executionProgram.body.map((statement) => {
        if (
          isImportDeclaration(statement) &&
          statement.source.value === "@depno/host"
        ) {
          return variableDeclaration("const", [
            variableDeclarator(
              objectPattern(
                statement.specifiers.map((specifier) =>
                  objectProperty(
                    identifier(
                      canonicalIdentifier(
                        CanonicalName({
                          uri: "@depno/host",
                          name: ((specifier as ImportSpecifier)
                            .imported as Identifier).name,
                        })
                      )
                    ),
                    identifier(
                      canonicalIdentifier(
                        CanonicalName({
                          uri: "@depno/host",
                          name: ((specifier as ImportSpecifier)
                            .imported as Identifier).name,
                        })
                      )
                    ),
                    false,
                    true
                  )
                )
              ),
              identifier("deps")
            ),
          ]);
        }
        return statement;
      });
      const replacePrgoram = program(
        [
          expressionStatement(
            arrowFunctionExpression(
              [identifier("deps")],
              blockStatement(replcaedStatements)
            )
          ),
        ],
        undefined,
        "module"
      );
      const stdout = new PassThrough();
      const toExecute = executeProgram(replacePrgoram);
      const promise = Promise.resolve(
        toExecute({
          [canonicalIdentifier(
            CanonicalName({
              uri: "@depno/host",
              name: "logToConsole",
            })
          )]: (data: string) => {
            stdout.push(data);
          },
        })
      );
      const eventEmitter = new EventEmitter();
      promise.then(() => {
        eventEmitter.emit("exit");
      });
      return {
        stdout,
        on: eventEmitter.on.bind(eventEmitter),
      };
    }),
  ],
]);

const FilesystemState = { filesystem: Map<string, string>() };