export function iteratorToArray<T>(iterable: Iterator<T>): T[] {
    
    // Unsure why "return [...iterable]" doesn't work.
    let arr: T[] = [];
    for (let val = iterable.next(); val != undefined; val = iterable.next()) {
        arr.push(val.value);
    }
    return arr;
}