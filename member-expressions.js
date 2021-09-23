import colors from "colors";
import { prettyPrint } from "./utils.js";
import * as NODE_TYPES from "./node-types.js";

// the code in this module is very similar to the code in declarations module. that is by desing. we
// can sort of refactor this, but tht is not a priority right now.

const findMemberExpressionsFromBody = (bodyArray) => {
  let returner = {};
  for (const node of bodyArray) {
    if (node.type == null) {
      throw new Error("Invalid ast. Type poperty missing on node");
    }

    switch (node.type) {
      case NODE_TYPES.VARIABLE_DECLARATION:
        for (const declaration of node.declarations) {
          // two member expressions are the same if they start on the same line.
          // honestly for this rule, this check seems to be most appropriate.
          if (declaration.init.type === NODE_TYPES.MEMBER_EXPRESSION) {
            returner[declaration.loc.start.line] = declaration.init;
          }
          if (declaration.init.type === NODE_TYPES.CHAIN_EXPRESSION) {
            returner[declaration.loc.start.line] = declaration.init.expression;
          }
        }
        break;
      case "FunctionDeclaration":
        returner = {
          ...returner,
          ...findMemberExpressionsFromBody(node.body.body),
        };
        break;
      case "ExpressionStatement":
        break;
      default:
        console.warn("Unknown node type encountered: " + node.type);
    }
  }
  return returner;
};

// root parser. this gets called first, and only passes the body array of the main program to the body parsing function above.
const findMemberExpressionsFromAST = (ast) => {
  if (ast.body == null) {
    throw new Error("ast does not contain a body array on the root");
  }
  return findMemberExpressionsFromBody(ast.body);
};

const findMemberExpressionChanges = (oldAst, newAst) => {
  const oldMemberExpressions = findMemberExpressionsFromAST(oldAst);
  const newMemberExpressions = findMemberExpressionsFromAST(newAst);

  const returner = [];
  for (const oldExpressionLineNumber in oldMemberExpressions) {
    if (oldExpressionLineNumber in newMemberExpressions) {
      const oldExpression = oldMemberExpressions[oldExpressionLineNumber];
      const newExpression = newMemberExpressions[oldExpressionLineNumber];
      // we already know that these two are on the same line.
      // now if they access the same property of the same object, we can know for sure that these are same.
      if (
        oldExpression.object.type === newExpression.object.type &&
        oldExpression.property.type === newExpression.property.type
      ) {
        returner.push({ old: oldExpression, new: newExpression });
      }
    }
  }
  return returner;
};
export default findMemberExpressionChanges;
