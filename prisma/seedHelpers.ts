import { faker } from '@faker-js/faker';

export function randomInt(min: number, max: number): number {
  return faker.number.int({ min, max });
}

export function randomFloat(min: number, max: number, multipleOf = 0.1): number {
  return faker.number.float({ min, max, multipleOf });
}

export function randomDate(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end });
}

export function randomEnumValue<T>(anEnum: T): T[keyof T] {
  const enumValues = Object.values(anEnum as object);
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex] as T[keyof T];
}

export function randomBoolean(): boolean {
  return faker.datatype.boolean();
}