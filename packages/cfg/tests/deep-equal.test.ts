import { deepEqual } from '../src/shared/deep-equal';
import '@anyit/be-dev';

describe('When deepEqual', () => {
  it('Then return true for equal objects', () => {
    const obj1 = {
      name: 'John',
      age: 30,
      address: { city: 'New York', zip: 12345 },
    };
    const obj2 = {
      name: 'John',
      age: 30,
      address: { city: 'New York', zip: 12345 },
    };

    expect(deepEqual(obj1, obj2)).toBe(true);
  });

  it('Then return false for objects with different property values', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { name: 'John', age: 40 };

    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('Then return false for objects with different property keys', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = { firstName: 'John', age: 30 };

    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('Then return false for objects with different nested properties', () => {
    const obj1 = {
      name: 'John',
      age: 30,
      address: { city: 'New York', zip: 12345 },
    };
    const obj2 = {
      name: 'John',
      age: 30,
      address: { city: 'London', zip: 54321 },
    };

    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('Then return false for objects with different property counts', () => {
    const obj1 = {
      name: 'John',
      age: 30,
      address: { city: 'New York', zip: 12345 },
    };
    const obj2 = { name: 'John', age: 30 };

    expect(deepEqual(obj1, obj2)).toBe(false);
  });

  it('Then return false for objects of different types', () => {
    const obj1 = { name: 'John', age: 30 };
    const obj2 = 'John';

    expect(deepEqual(obj1, obj2)).toBe(false);
  });
});
