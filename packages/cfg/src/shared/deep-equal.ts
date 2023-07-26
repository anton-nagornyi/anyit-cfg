export const deepEqual = (obj1: any, obj2: any) => {
  if (obj1 === obj2) {
    return true; // Same object reference or same primitive value
  }

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false; // Different types or null values
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false; // Different number of properties
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false; // Different property keys
    }

    if (!deepEqual(obj1[key], obj2[key])) {
      return false; // Recursive comparison of property values
    }
  }

  return true; // All properties are deeply equal
};
