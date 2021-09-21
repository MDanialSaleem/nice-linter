import { parse } from "espree";

// in reality this would come from some kind of file.
const oldSourceCode = "var foo = 1";
const newSourceCode = "let foo = 1";

const parserOptions = { ecmaVersion: 6 };
const oldAst = parse(oldSourceCode, parserOptions);
const newAst = parse(newSourceCode, parserOptions);

let varFound = false;
let letFound = false;
for (let node of oldAst.body) {
  if (node.type == "VariableDeclaration" && node.kind == "var") {
    varFound = true;
  }
}
for (let node of newAst.body) {
  if (node.type == "VariableDeclaration" && node.kind == "let") {
    letFound = true;
  }
}

if (varFound && letFound) {
  console.log("Good work!You converted var to let.");
}
