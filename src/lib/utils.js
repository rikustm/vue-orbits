export function setItem(array, item, length) {
  array.unshift(item) > length ? array.pop() : null;
}
