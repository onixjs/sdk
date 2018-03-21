export namespace Utils {
  export function IsJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  export function uuid() {
    return `${new Date().getMilliseconds()}:${Utils.getRandomInt(
      9999999999999,
    )}:${Utils.getRandomInt(9999999999999)}`;
  }

  export function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
}
