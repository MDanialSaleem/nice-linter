"use strict";
let iAmVariable = 1;
function func() {
  let foo = 1,
    foo2 = 2;
  let bar = foo;

  if (iAmVariable == 1) {
    let ifVar = 9;
  } else if (iAmVariable == 2) {
    let elseifVar = 10;
  } else {
    let elseVar = 11;
  }
  let moreBar = bar?.prop;
}
let a = {};
let b = a?.b;
const funcA = ({ a, b }, c) => {};
const funcB = () => {};
let person = "Monty";
var action = `${person} ${b} eats apple`;
console.log(sentence);
for (let i = 0; i < 10; i++) {
  var iReduced = i;
}
