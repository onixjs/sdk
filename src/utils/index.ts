export namespace Utils {
  export function IsJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  let uuidCounter = 1;

  export function uuid() {
    if (uuidCounter === Number.MAX_SAFE_INTEGER) {
      uuidCounter = 1;
    }
    return `${new Date().getMilliseconds()}:${uuidCounter++}`;
  }

  export function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
}
