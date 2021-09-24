import colors from "colors";
import { prettyPrint } from "./utils.js";
import * as NODE_TYPES from "./node-types.js";
import lodash from "lodash";

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
        break;
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

export const ruleFunctionKeywordToArrow = (functionChanges) => {
  for (const functionChange of functionChanges) {
    if (
      (functionChange.old.type === NODE_TYPES.FUNCTION_DECLARATION ||
        functionChange.old.type === NODE_TYPES.FUNCTION_EXPRESSION) &&
      functionChange.new.type === NODE_TYPES.AROOW_FUNCTION_EXPRESSION
    ) {
      console.log(
        `Great job!You converted the function ${functionChange.old.name} from function keyword to arrow function`
      );
    }
  }
};

// given a function declaration, this function finds paramters of simple kind(not object or array destructure
// and returns their names
const findSimpleParams = (functionDeclaration) =>
  functionDeclaration.params
    .filter((param) => param.type === NODE_TYPES.IDENTIFIER)
    .map((param) => param.name);

export const ruleOptionsObjectPattern = (functionChanges) => {
  for (const functionChange of functionChanges) {
    // we first find paramters that were deleted from the old function. let's say they are a, b;
    // then we check if those two paramters are available as properties of an ObjectPattern in the new function.
    // this indicates that they were not deleted but infact converted to options object.
    const deletedParamsInOld = lodash.difference(
      findSimpleParams(functionChange.old),
      findSimpleParams(functionChange.new)
    );
    const objectParamsInNew = functionChange.new.params
      .filter((param) => param.type === NODE_TYPES.OBJECT_PATTERN)
      .flatMap((param) =>
        param.properties.map((property) => property.key.name)
      );
    const commonParameters = lodash.intersection(
      deletedParamsInOld,
      objectParamsInNew
    );
    if (commonParameters.length > 0) {
      console.log(
        `Great Work! You converted paramters ${commonParameters.join(
          ","
        )} to options object pattern in function ${functionChange.old.name}`
      );
    }
  }
};

export default findFunctionChanges;
