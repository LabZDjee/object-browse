/* jshint esversion: 6 */

const { objectBrowse, makeSubObjectFrom } = require("./index");

const { greenBright, red, redBright, yellow } = require("chalk");
const _ = require("lodash");

reflectInArray = function* () {
  const result = [];
  while (true) {
    result.push(yield { result });
  }
};

specialReflectInArray = function* () {
  const result = [];
  let keyAtLevel1 = null;
  let stopAtThisLevel = false;
  while (true) {
    const y = yield { result, stopAtThisLevel };
    stopAtThisLevel = keyAtLevel1 === "level1_c1" && y.prop === 3;
    if (y.level === 1) {
      keyAtLevel1 = y.prop;
    }
    result.push(y);
  }
};
genWhichReturns = function* (initialStuff) {
  yield 0;
  return initialStuff;
};

const pattern = {
  a: null,
  b: { bb: null, bc: null, bd: { bde: null, bdf: null } },
  c: [null, { c1d: null, c1e: null }],
  d: null,
};

const source = {
  a: "a",
  b: { bb: "bb", bc: NaN, bd: { bde: "bde", bdf: "bdf", ignore: 0 }, ignore: 0 },
  c: [3, { c1d: 31, c1e: 32, ignore1: 33, ignore2: 34 }],
  d: "d",
  ignore: "e",
};

const result = {
  a: "a",
  b: { bb: "bb", bc: NaN, bd: { bde: "bde", bdf: "bdf" } },
  c: [3, { c1d: 31, c1e: 32 }],
  d: "d",
};

const obj1 = {
  level1_a: "starting...",
  level1_b: { level2_a: 21, level2_b: 22 },
  level1_c: [NaN, 1 / 0, 42, { pi: Math.PI, doublePi: Math.PI * 2 }],
  level1_d: "...finished",
};

const obj1ResultingArray = [
  { prop: null, value: obj1, type: 1, level: 0 },
  { prop: "level1_a", value: "starting...", type: 0, level: 1 },
  { prop: "level1_b", value: obj1.level1_b, type: 1, level: 1 },
  { prop: "level2_a", value: 21, type: 0, level: 2 },
  { prop: "level2_b", value: 22, type: 0, level: 2 },
  { prop: "level1_c", value: obj1.level1_c, type: 2, level: 1 },
  { prop: 0, value: NaN, type: 0, level: 2 },
  { prop: 1, value: Infinity, type: 0, level: 2 },
  { prop: 2, value: 42, type: 0, level: 2 },
  { prop: 3, value: obj1.level1_c[3], type: 1, level: 2 },
  { prop: "pi", value: Math.PI, type: 0, level: 3 },
  { prop: "doublePi", value: Math.PI * 2, type: 0, level: 3 },
  { prop: "level1_d", value: "...finished", type: 0, level: 1 },
];

const obj2 = {
  level1_a: "starting...",
  level1_b: { level2_a: 21, level2_b: 22 },
  level1_c1: [NaN, 1 / 0, 42, { pi: Math.PI, doublePi: Math.PI * 2 }],
  level1_c2: [NaN, 1 / 0, 42, { pi: Math.PI, doublePi: Math.PI * 2 }],
  level1_d: "...finished",
};

const obj2ResultingArray = [
  { prop: null, value: obj2, type: 1, level: 0 },
  { prop: "level1_a", value: "starting...", type: 0, level: 1 },
  { prop: "level1_b", value: obj2.level1_b, type: 1, level: 1 },
  { prop: "level2_a", value: 21, type: 0, level: 2 },
  { prop: "level2_b", value: 22, type: 0, level: 2 },
  { prop: "level1_c1", value: obj2.level1_c1, type: 2, level: 1 },
  { prop: 0, value: NaN, type: 0, level: 2 },
  { prop: 1, value: Infinity, type: 0, level: 2 },
  { prop: 2, value: 42, type: 0, level: 2 },
  { prop: 3, value: obj2.level1_c1[3], type: 1, level: 2 },
  { prop: "level1_c2", value: obj2.level1_c2, type: 2, level: 1 },
  { prop: 0, value: NaN, type: 0, level: 2 },
  { prop: 1, value: Infinity, type: 0, level: 2 },
  { prop: 2, value: 42, type: 0, level: 2 },
  { prop: 3, value: obj2.level1_c2[3], type: 1, level: 2 },
  { prop: "pi", value: Math.PI, type: 0, level: 3 },
  { prop: "doublePi", value: Math.PI * 2, type: 0, level: 3 },
  { prop: "level1_d", value: "...finished", type: 0, level: 1 },
];

let step = 0;
let errors = 0;

function stepHeader(msg) {
  step++;
  console.log(`*** step ${step} ***  ${msg}`);
}

function gotError(msg) {
  if (!msg) {
    msg = "with this verification";
  }
  errors++;
  console.log(red(`Error ${msg}`));
}

console.log(yellow("Package type tests"));
stepHeader("test objectBrowse on a simple generator");
let testResult = objectBrowse(obj1, reflectInArray);
console.log(" should return with {completed: true}");
if (testResult.completed !== true) {
  gotError();
}
console.log(" verification of contents {result}");
if (!_.isEqual(testResult.result, obj1ResultingArray)) {
  gotError();
}
stepHeader("test objectBrowse on a simple generator which stops nesting at a certain level");
testResult = objectBrowse(obj2, specialReflectInArray);
console.log(" should return with {completed: true}");
if (testResult.completed !== true) {
  gotError();
}
console.log(" verification of contents {result}");
if (!_.isEqual(testResult.result, obj2ResultingArray)) {
  gotError();
}
stepHeader("test objectBrowse on a generator which returns instead of yield");
console.log(" should get returned message from generator and have {completed: false}");
const panic = "panic!!!";
testResult = objectBrowse(obj1, genWhichReturns, panic);
if (testResult.completed !== false) {
  gotError(": {completed} not false");
}
if (testResult.result !== panic) {
  gotError(": could not get returned message from generator");
}
stepHeader("throws when objectBrowse called on a non object");
try {
  testResult = objectBrowse(3, genWhichReturns);
  gotError(": has not thrown as it should");
} catch (e) {
  const expectedSubString = "unexpected entity";
  if (!e.message.includes(expectedSubString)) {
    gotError(`: error message does not include "${expectedSubString}"`);
  } else {
    console.log(` ok, throws with a message including "${expectedSubString}"`);
  }
}
stepHeader("test successful makeSubObjectFrom");
testResult = makeSubObjectFrom(pattern, source);
if (testResult.completed !== true) {
  gotError(": {completed} not true");
}
if (!_.isEqual(testResult.result, result)) {
  gotError(": could not get expected object");
}
stepHeader("test a failure on makeSubObjectFrom (missing prop in source object)");
const wrongSource = _.cloneDeepWith(source);
delete wrongSource.b.bd.bde;
testResult = makeSubObjectFrom(pattern, wrongSource);
if (testResult.completed !== false) {
  gotError(": {completed} not false");
}
const missingPropertyAsString = "b.bd.bde";
if (!testResult.result.includes(missingPropertyAsString)) {
  gotError(
    `: should find "${missingPropertyAsString}" in result message when wrong. Instead got: ${testResult.result}`
  );
} else {
  console.log(` ok, got message "${testResult.result}" which includes "${missingPropertyAsString}"`);
}
const testArray = [{ a: 1, b: 2, C: { ca: 33, bc: 34 } }];
testResult = makeSubObjectFrom(testArray, testArray);
stepHeader("test makeSubObjectFrom on an array");
if (testResult.completed !== true || !_.isEqual(testResult.result, testArray)) {
  gotError(
    `: completed is ${testResult.completed} - result meeting expectations is ${_.isEqual(testResult.result, testArray)}`
  );
}
stepHeader("failure when makeSubObjectFrom source is not an object or array");
const sourceHasWrongType = "source in makeSubObjectFrom has wrong type";
testResult = makeSubObjectFrom({}, 3);
if (testResult.completed !== false) {
  gotError(': should return a "completed" prop as false');
} else if (!testResult.result.includes(sourceHasWrongType)) {
  gotError(`: should find "${sourceHasWrongType}" in result message when wrong. Instead got: ${testResult.result}`);
} else {
  console.log(` ok, got message which includes "${sourceHasWrongType}"`);
}

if (errors > 0) {
  console.log(redBright(`FAIL with ${errors} error${errors > 1 ? "s" : ""}`));
} else {
  console.log(greenBright("PASS"));
}
