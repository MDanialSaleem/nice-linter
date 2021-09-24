#!/usr/bin/env node
import { parse } from "espree";
import { readFileSync } from "fs";
import { prettyPrint } from "./src/utils/index.js";
import process from "process";
import yargs from "yargs";
import findDeclarationChanges, {
  ruleCamelCase,
  ruleTemplateLiterals,
  ruleVarToLet,
} from "./src/rules/declarations.js";
import findMemberExpressionChanges, {
  ruleOptionalChainign,
} from "./src/rules/member-expressions.js";
import findFunctionChanges, {
  ruleFunctionKeywordToArrow,
  ruleOptionsObjectPattern,
} from "./src/rules/functions.js";
import colors from "colors";

const mainFunc = (oldFileName, newFileName) => {
  const oldSourceCode = readFileSync(oldFileName);
  const newSourceCode = readFileSync(newFileName);
  // ecmaVersion is JS version and loc means enablign line numbers on nodes.
  const parserOptions = { ecmaVersion: 11, loc: true };
  const oldAst = parse(oldSourceCode, parserOptions);
  const newAst = parse(newSourceCode, parserOptions);

  const output = [];
  const functionChanges = findFunctionChanges(oldAst, newAst);
  output.push(...ruleFunctionKeywordToArrow(functionChanges));
  ruleOptionsObjectPattern(functionChanges);

  const variableDeclerationChanges = findDeclarationChanges(oldAst, newAst);
  output.push(...ruleVarToLet(variableDeclerationChanges));
  output.push(...ruleCamelCase(variableDeclerationChanges));
  output.push(...ruleTemplateLiterals(variableDeclerationChanges));

  const memberExpressionChanges = findMemberExpressionChanges(oldAst, newAst);
  ruleOptionalChainign(memberExpressionChanges);

  return output;
};
const y = yargs();

y.command({
  command: "linters",
  describe:
    "Commends you for making changes in the code that reflect best practices",
  builder: {
    old: {
      describe: "Old file path",
      demandOption: true,
      type: "string",
    },
    new: {
      describe: "New file path",
      demandOption: true,
      type: "string",
    },
  },
  handler(argv) {
    LinterFn(argv.old, argv.new);
  },
});

y.parse(process.argv.slice(2));

function LinterFn(oldFileName, newFileName) {
  let output = mainFunc(oldFileName, newFileName);
  output.forEach((output) => {
    console.log(`On Line ${output.line}: ${output.message}`);
  });
}

export default mainFunc;
