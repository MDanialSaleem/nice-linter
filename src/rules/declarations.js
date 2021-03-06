// this file deals with finding changes in declarations.
// the exported method here returns an array. each member of the arrray is an object of kind
// {
//     old: declarationObject.
//     new: declarationObject.
// }
// where each decarationObject is of the following form
// {
//     "type": "VariableDeclarator",
//     "start": 122,
//     "end": 127,
//     "id": {
//       "type": "Identifier",
//       "start": 122,
//       "end": 123,
//       "name": "c"
//     },
//     "init": {
//       "type": "Literal",
//       "start": 126,
//       "end": 127,
//       "value": 1,
//       "raw": "1"
//     }
//   }
// notice that this form is the same as the form found in the original parse tree created by the espree library that we use.
// so in essence if a variable declaration has changed, it will appear in this declaration. if there are no variable declaration changes between the old and
// new code, the array will be empty.

// the body array, is basically an array of nodes. where each node can be a var declaration, function declaration if else block etc.
import colors from "colors";
import camelCase from "camelcase";
import {
  BLOCK_STATEMENT,
  DO_WHILE_STATEMENT,
  EXPRESSION_STATEMENT,
  FOR_STATEMENT,
  FUNCTION_DECLARATION,
  IF_STATEMENT,
  SWITCH_STATEMENT,
  VARIABLE_DECLARATION,
  WHILE_STATEMENT,
} from "../constants/node-types.js";
import { prettyPrint } from "../utils/index.js";

const findDeclarationsFromIfElifElse = (node) => {
  let returner = {};
  switch (node.type) {
    case IF_STATEMENT:
      returner = {
        ...returner,
        ...findDeclarationsFromBody(node.consequent.body),
        ...(node.alternate != null
          ? findDeclarationsFromIfElifElse(node.alternate)
          : []),
      };
      break;
    case BLOCK_STATEMENT:
      returner = {
        ...returner,
        ...findDeclarationsFromBody(node.body),
      };
    default:
      break;
  }
  return returner;
};
const findDeclarationsFromSwitch = (node) => {
  let returner = {};
  for (const switchCase of node.cases) {
    returner = {
      ...returner,
      ...findDeclarationsFromBody(switchCase.consequent),
    };
  }
  return returner;
};
const findDeclarationsFromBody = (bodyArray) => {
  let returner = {};
  for (const node of bodyArray) {
    if (node.type == null) {
      throw new Error("Invalid ast. Type poperty missing on node");
    }
    switch (node.type) {
      case VARIABLE_DECLARATION:
        for (const declaration of node.declarations) {
          returner[declaration.id.name] = declaration;
          // so basically if you have let a = 1, b = 2; they will be stored as two declarations but their kind witll be stored on a top level object.
          // uncomment the prettyPrint call at the start of this function  to see the distinction.
          returner[declaration.id.name].kind = node.kind;
        }
        break;
      case FUNCTION_DECLARATION:
        returner = { ...returner, ...findDeclarationsFromBody(node.body.body) };
        break;
      case EXPRESSION_STATEMENT:
        returner[node.expression.type] = node;
        break;
      case IF_STATEMENT:
        returner = {
          ...returner,
          ...findDeclarationsFromIfElifElse(node),
        };
        break;
      case FOR_STATEMENT:
      case DO_WHILE_STATEMENT:
      case WHILE_STATEMENT:
        returner = {
          ...returner,
          ...findDeclarationsFromBody(node.body.body),
        };
        break;
      case SWITCH_STATEMENT:
        returner = {
          ...returner,
          ...findDeclarationsFromSwitch(node),
        };
        break;
      default:
        break;
    }
  }
  return returner;
};

// root parser. this gets called first, and only passes the body array of the main program to the body parsing function above.
const findDeclrationsFromAst = (ast) => {
  if (ast.body == null) {
    throw new Error("ast does not contain a body array on the root");
  }
  return findDeclarationsFromBody(ast.body);
};

const findDeclarationChanges = (oldAst, newAst) => {
  const oldDeclarations = findDeclrationsFromAst(oldAst);
  const newDeclarations = findDeclrationsFromAst(newAst);
  const returner = [];
  if ("Literal" in newDeclarations && !("Literal" in oldDeclarations))
    console.log(
      `You have now used "use Strict" directive. The code should now be executed in "strict mode". `
    );

  for (let variable in oldDeclarations) {
    let newVariable = variable.replace(/_/g, "").toLowerCase();
    if (newVariable == variable) break;
    else {
      oldDeclarations[newVariable] = oldDeclarations[variable];
      delete oldDeclarations[variable];
    }
  }
  for (let variable in newDeclarations) {
    let newVariable = variable.replace(/_/g, "").toLowerCase();
    if (newVariable == variable) break;
    else {
      newDeclarations[newVariable] = newDeclarations[variable];
      delete newDeclarations[variable];
    }
  }

  for (const variable in oldDeclarations) {
    if (
      variable in newDeclarations &&
      variable != ("Literal" && "CallExpression")
    ) {
      // the problem here is discovering the same variable in old and new files. our definition of same variable is that it has the same name and that it is on the same line.
      // another possible definition can be that it has the same name and it is in the same scope. i think this might be better
      // anyway the definition do not matter and can be changed later. for now this suffices.
      const oldVar = oldDeclarations[variable];
      const newVar = newDeclarations[variable];
      returner.push({ old: oldVar, new: newVar });
    }
  }
  return returner;
};

export const ruleVarToLet = (variableDeclerationChanges) => {
  const retuner = [];
  for (const changes of variableDeclerationChanges) {
    const oldVar = changes.old;
    const newVar = changes.new;
    if (oldVar.kind === "var" && newVar.kind === "let") {
      retuner.push({
        line: newVar.loc.start.line,
        message: `Good work. You changed the type of variable ${oldVar.id.name} from var to let`,
      });
    }
  }
  return retuner;
};

const hasUpperCase = (s) => s.toLowerCase() != s;

export const ruleCamelCase = (variableDeclerationChanges) => {
  const retuner = [];
  for (const changes of variableDeclerationChanges) {
    const oldVar = changes.old;
    const newVar = changes.new;
    if (
      hasUpperCase(newVar.id.name) && oldVar.id.name.match(/_/g, "")
        ? true
        : false
    ) {
      if (newVar.id.name === camelCase(oldVar.id.name)) {
        retuner.push({
          line: newVar.loc.start.line,
          message: `Great job!You have followed the camelCase style for naming variables. Changed ${oldVar.id.name} to ${newVar.id.name}. `,
        });
      }
    }
  }
  return retuner;
};

export const ruleTemplateLiterals = (variableDeclerationChanges) => {
  const returner = [];
  for (const changes of variableDeclerationChanges) {
    const oldVar = changes.old;
    const newVar = changes.new;
    if (
      newVar.init.type === "TemplateLiteral" &&
      oldVar.init.type !== "TemplateLiteral"
    ) {
      returner.push({
        line: newVar.loc.start.line,
        message: `Good going since you have switched to use template literal in ${oldVar.id.name}.`,
      });
    }
  }
  return returner;
};
export default findDeclarationChanges;
