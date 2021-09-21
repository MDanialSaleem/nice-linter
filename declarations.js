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
import { prettyPrint } from "./utils.js";

const findDeclarationsFromBody = (bodyArray) => {
  // prettyPrint(bodyArray, colors.blue);
  let returner = {};
  for (const node of bodyArray) {
    if (node.type == null) {
      throw new Error("Invalid ast. Type poperty missing on node");
    }

    switch (node.type) {
      case "VariableDeclaration":
        for (const declaration of node.declarations) {
          returner[declaration.id.name] = declaration;
          // so basically if you have let a = 1, b = 2; they will be stored as two declarations but their kind witll be stored on a top level object.
          // uncomment the prettyPrint call at the start of this function  to see the distinction.
          returner[declaration.id.name].kind = node.kind;
        }
        break;
      case "FunctionDeclaration":
        returner = { ...returner, ...findDeclarationsFromBody(node.body.body) };
        break;
      default:
        console.warn("Unknown node type encountered: " + node.type);
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
  for (const variable in oldDeclarations) {
    if (variable in newDeclarations) {
      // the problem here is discovering the same variable in old and new files. our definition of same variable is that it has the same name and that it is on the same line.
      // another possible definition can be that it has the same name and it is in the same scope. i think this might be better
      // anyway the definition do not matter and can be changed later. for now this suffices.
      const oldVar = oldDeclarations[variable];
      const newVar = newDeclarations[variable];
      if (oldVar.start === newVar.start && oldVar.end === newVar.end) {
        returner.push({ old: oldVar, new: newVar });
      }
    }
  }
  return returner;
};
export default findDeclarationChanges;
