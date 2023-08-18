"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastValueFromAsyncIterableIterator = exports.isAsyncIterator = void 0;
function isAsyncIterator(v) {
    return typeof v?.[Symbol.asyncIterator] === 'function';
}
exports.isAsyncIterator = isAsyncIterator;
async function getLastValueFromAsyncIterableIterator(i) {
    let prev;
    let current;
    do {
        prev = current;
        current = await i.next();
    } while (!current.done);
    return current.value !== undefined || !prev ? current.value : prev.value;
}
exports.getLastValueFromAsyncIterableIterator = getLastValueFromAsyncIterableIterator;
