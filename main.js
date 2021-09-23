import { parse } from "espree";
import { readFileSync } from "fs";
import colors from "colors";
import camelCase from "camelcase";
import { prettyPrint } from "./utils.js";
import findDeclarationChanges from "./declarations.js";
import findMemberExpressionChanges from "./member-expressions.js";
import findFunctionChanges, {
  ruleFunctionKeywordToArrow,
  ruleOptionsObjectPattern,
} from "./functions.js";
import * as NODE_TYPES from "./node-types.js";

// in reality this would come from some kind of file.
const oldSourceCode = readFileSync("./test/old.js");
const newSourceCode = readFileSync("./test/new.js");
// ecmaVersion is JS version and loc means enablign line numbers on nodes.
const parserOptions = { ecmaVersion: 11, loc: true };
const oldAst = parse(oldSourceCode, parserOptions);
const newAst = parse(newSourceCode, parserOptions);

const variableDeclerationChanges = findDeclarationChanges(oldAst, newAst);

const hasUpperCase = (s) => s.toLowerCase() != s;

for (const changes of variableDeclerationChanges) {
  const oldVar = changes.old;
  const newVar = changes.new;
  if (oldVar.kind === "var" && newVar.kind === "let") {
    console.log(
      `Good work. You changed the type of variable ${oldVar.id.name} from var to let`
    );
  }
  if (hasUpperCase(newVar.id.name)) {
    if (newVar.id.name === camelCase(oldVar.id.name)) {
      console.log(
        `Great job!You have followed the camelCase style for naming variables. Changed ${oldVar.id.name} to ${newVar.id.name}. `
      );
    }
  }
}

const memberExpressionChanges = findMemberExpressionChanges(oldAst, newAst);
for (const memberExpressionChange of memberExpressionChanges) {
  if (
    memberExpressionChange.old.optional === false &&
    memberExpressionChange.new.optional === true
  ) {
    console.log(
      `Great job!You converted a property change to optional property change at line ${memberExpressionChange.old.loc.start.line}`
    );
  }
}

const functionChanges = findFunctionChanges(oldAst, newAst);
ruleFunctionKeywordToArrow(functionChanges);
ruleOptionsObjectPattern(functionChanges);
