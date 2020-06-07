/* jshint esversion: 6 */

const _ = require("lodash");

function analyzeObjType(value) {
  if (Array.isArray(value)) {
    return 2;
  }
  if (typeof value === "object" && value !== null) {
    return 1;
  }
  return 0;
}

function objTypeToSkeleton(value) {
  if (Array.isArray(value)) {
    return { value: [], type: 2 };
  }
  if (typeof value === "object" && value !== null) {
    return { value: {}, type: 1 };
  }
  return { value, type: 0 };
}

function objectDeepCopy(source) {
  function proc(ref, copy, withType) {
    switch (withType) {
      case 1:
      case 2:
        Object.keys(ref).forEach((k) => {
          const { value, type } = objTypeToSkeleton(ref[k]);
          proc(ref[k], (copy[k] = value), type);
        });
        break;
      default:
        copy = ref;
        break;
    }
  }
  const { value, type } = objTypeToSkeleton(source);
  const result = value;
  proc(source, result, type);
  return result;
}

function objectDeepEqual(source, reference) {
  const shouldReturnFalse = "shouldReturnFalseMessage";
  function proc(src, ref) {
    const srcType = analyzeObjType(src);
    if (srcType !== analyzeObjType(ref)) {
      throw new Error(shouldReturnFalse);
    }
    switch (srcType) {
      case 1:
      case 2:
        const srcKeys = Object.keys(src);
        const refKeys = Object.keys(ref);
        if (srcKeys.length !== refKeys.length || !refKeys.every((v) => srcKeys.indexOf(v) !== -1)) {
          throw new Error(shouldReturnFalse);
        }
        Object.keys(src).forEach((k) => {
          proc(src[k], ref[k]);
        });
        break;
      default:
        if (src !== ref && !(Number.isNaN(src) && Number.isNaN(ref))) {
          throw new Error(shouldReturnFalse);
        }
        break;
    }
  }
  try {
    proc(source, reference);
  } catch (error) {
    // much awaiting "Conditional catch clauses", better than re-throw
    if (error.message === shouldReturnFalse) {
      return false;
    } else {
      throw error;
    }
  }
  return true;
}

const testObj = [
  {
    a: { aa: "aa", ab: "ab" },
    b: { ba: "ba", bb: "bb", bc: ["bc0", { bc1a: "bc1a", bc1b: "bc1b" }, "bc2"] },
    c: "c",
  },
  {
    a: { aa: "aa", ab: "ab" },
    b: {
      ba: "ba",
      bb: null,
      bc: [
        3,
        { bc1a: NaN, bc1b: /h/ },
        function (x) {
          return 2 * x;
        },
      ],
    },
    c: "c",
  },
];

const copy = objectDeepCopy(testObj);
console.log(_.isEqual(testObj, copy));
console.log(objectDeepEqual(testObj, copy));
