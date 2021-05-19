export interface WeightedObject<T> {
  obj: T;
  w: number;
}

export function choose<T>(array: Array<T>): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

export function weightedChoose<T>(
  array: Array<WeightedObject<T>>
): T | undefined {
  let counter = array.reduce((prev, cur) => {
    return { w: prev.w + cur.w, obj: prev.obj };
  }).w;

  let rand = Math.floor(Math.random() * counter);

  counter = 0;
  let val: T | undefined = undefined;
  array.every((elem) => {
    counter += elem.w;
    if (counter > rand) {
      val = elem.obj;
      return false;
    }
    return true;
  });
  return val;
}

export function randomColor() {
  let result = '#';
  for (let i = 0; i < 3; i++) {
    result += ('0' + (Math.random() * (1 << 8)).toString(16)).slice(-2);
  }
  return result;
}
