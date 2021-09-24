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
  const oldSourceCode = readFileSync(oldFileName);
  const newSourceCode = readFileSync(newFileName);
  // ecmaVersion is JS version and loc means enablign line numbers on nodes.
  const parserOptions = { ecmaVersion: 11, loc: true };
  const oldAst = parse(oldSourceCode, parserOptions);
  const newAst = parse(newSourceCode, parserOptions);

  const functionChanges = findFunctionChanges(oldAst, newAst);
  ruleFunctionKeywordToArrow(functionChanges);
  ruleOptionsObjectPattern(functionChanges);

  const variableDeclerationChanges = findDeclarationChanges(oldAst, newAst);
  ruleVarToLet(variableDeclerationChanges);
  ruleCamelCase(variableDeclerationChanges);
  ruleTemplateLiterals(variableDeclerationChanges);

  const memberExpressionChanges = findMemberExpressionChanges(oldAst, newAst);
  ruleOptionalChainign(memberExpressionChanges);
}
