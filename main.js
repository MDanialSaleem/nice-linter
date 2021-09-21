import { parse } from "espree";
import { readFileSync } from "fs";
import colors from "colors";

import { prettyPrint } from "./utils.js";
import findDeclarationChanges from "./declarations.js";
// in reality this would come from some kind of file.
const oldSourceCode = readFileSync("./test/old.js");
const newSourceCode = readFileSync("./test/new.js");
const parserOptions = { ecmaVersion: 6 };
const oldAst = parse(oldSourceCode, parserOptions);
const newAst = parse(newSourceCode, parserOptions);

const variableDeclerationChanges = findDeclarationChanges(oldAst, newAst);

prettyPrint(variableDeclerationChanges, colors.yellow);

for (const changes of variableDeclerationChanges) {
  const oldVar = changes.old;
  const newVar = changes.new;
  if (oldVar.kind === "var" && newVar.kind === "let") {
    console.log(
      `Good work. You changed the type of variable ${oldVar.id.name} from var to let`
    );
  }
}
