/* jshint esversion: 6 */

exports.objectBrowse = function (object, processor, initialValue) {
  const exceptionMessage = "Exception Message";
  const iter = processor(initialValue);
  let completed = true;
  let result;
  function handleResult(r) {
    if (r.done) {
      result = r.value;
      throw new Error(exceptionMessage);
    }
    result = r.value.result;
    return r.value.stopAtThisLevel ? false : true;
  }
  function proc(entity, level) {
    if (Array.isArray(entity)) {
      if (level === 0) {
        handleResult(iter.next({ prop: null, value: entity, type: 2, level }));
        level++;
      }
      entity.forEach((value, prop) => {
        if (typeof value !== "object" || value === null) {
          handleResult(iter.next({ prop, value, type: 0, level }));
        } else {
          if (handleResult(iter.next({ prop, value, type: Array.isArray(value) ? 2 : 1, level }))) {
            proc(value, level + 1);
          }
        }
      });
    } else if (typeof entity === "object" && entity !== null) {
      Object.keys(entity).forEach((prop) => {
        if (level === 0) {
          handleResult(iter.next({ prop: null, value: entity, type: 1, level }));
          level++;
        }
        const value = entity[prop];
        if (typeof value !== "object" || value === null) {
          handleResult(iter.next({ prop, value, type: 0, level }));
        } else {
          if (handleResult(iter.next({ prop, value, type: Array.isArray(value) ? 2 : 1, level }))) {
            proc(value, level + 1);
          }
        }
      });
    } else {
      throw new Error(
        `Fatal in objectBrowse at level ${level}, receiving an unexpected entity of type ${typeof entity}`
      );
    }
  }
  try {
    const first = iter.next();
    if (first.done === true) {
      completed = false;
      result = first.value;
    } else {
      proc(object, 0);
    }
  } catch (error) {
    if (error.message === exceptionMessage) {
      completed = false;
    } else {
      throw error;
    }
  }
  return { result, completed };
};

function* makeSubObjectFromGenerator(initialValue) {
  const initialValueNotObject = typeof initialValue !== "object";
  const initialValueNotObjectMsg = `source in makeSubObjectFrom has wrong type (${typeof initialValue}) instead of object`;
  if (initialValueNotObject) {
    return initialValueNotObjectMsg;
  }
  const resultPointers = [];
  const { type } = yield { result: resultPointers[0] };
  resultPointers[0] = type === 2 ? [] : {};
  const initialValuePointers = [initialValue];
  while (true) {
    const { prop, type, level } = yield { result: resultPointers[0] };
    while (level < resultPointers.length - 1) {
      resultPointers.pop();
    }
    const zeroBasedLevel = level - 1;
    const currentInitialValuePointer = initialValuePointers[zeroBasedLevel];
    if (!currentInitialValuePointer.hasOwnProperty(prop)) {
      let props = "";
      for (let lv = 0; lv < zeroBasedLevel; lv++) {
        props += `${Object.keys(initialValuePointers[lv]).find(
          (k) => initialValuePointers[lv + 1] === initialValuePointers[lv][k]
        )}.`;
      }
      return `source in makeSubObjectFrom has no property ${props}${prop}`;
    }
    initialValuePointers[level] = currentInitialValuePointer[prop];
    if (type === 0) {
      resultPointers[zeroBasedLevel][prop] = currentInitialValuePointer[prop];
    } else {
      resultPointers[zeroBasedLevel][prop] = type === 2 ? [] : {};
      resultPointers[level] = resultPointers[zeroBasedLevel][prop];
    }
  }
}

exports.makeSubObjectFrom = function (pattern, source) {
  return exports.objectBrowse(pattern, makeSubObjectFromGenerator, source);
};
