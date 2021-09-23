import colors from "colors";
import { prettyPrint } from "./utils.js";
import * as NODE_TYPES from "./node-types.js";

// these use the function keyword.
const findFunctionDeclarationsFromBody = (bodyArray) => {
  let returner = {};
  for (const node of bodyArray) {
    if (node.type == null) {
      throw new Error("Invalid ast. Type poperty missing on node");
    }

    switch (node.type) {
      case NODE_TYPES.VARIABLE_DECLARATION:
        for (const declaration of node.declarations) {
          if (
            declaration.init.type === NODE_TYPES.FUNCTION_EXPRESSION ||
            declaration.init.type === NODE_TYPES.AROOW_FUNCTION_EXPRESSION
          ) {
            returner[declaration.id.name] = declaration.init;
          }
        }
        break;
      case "FunctionDeclaration":
        returner[node.id.name] = node;
        break;
      default:
        console.warn("Unknown node type encountered: " + node.type);
    }
  }
  return returner;
};

// root parser. this gets called first, and only passes the body array of the main program to the body parsing function above.
const findFunctionDeclarationsFromAST = (ast) => {
  if (ast.body == null) {
    throw new Error("ast does not contain a body array on the root");
  }
  return findFunctionDeclarationsFromBody(ast.body);
};

const findFunctionChanges = (oldAst, newAst) => {
  const oldFunctions = findFunctionDeclarationsFromAST(oldAst);
  const newFunctions = findFunctionDeclarationsFromAST(newAst);

  const returner = [];

  for (const functionDeclaration in oldFunctions) {
    // two functions are the same if they have the same name
    if (functionDeclaration in newFunctions) {
      returner.push({
        old: {
          ...oldFunctions[functionDeclaration],
          name: functionDeclaration,
        },
        new: {
          ...newFunctions[functionDeclaration],
          name: functionDeclaration,
        },
      });
    }
  }
  return returner;
};
export default findFunctionChanges;
