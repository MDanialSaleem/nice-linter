let iAmVariable = 1;
function func() {
  let foo = 1,
    foo2 = 2;
  let bar = foo;

  if (true) {
    console.log("s");
  }
  let moreBar = bar?.prop;
}
let a = {};
let b = a?.b;
const funcA = () => {};
const funcB = () => {};
