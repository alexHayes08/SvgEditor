export function convertToEnum<T>(value: string|number, enumObj: T): T[keyof T] {
    if (isKeyOf(value, enumObj)) {
        return enumObj[value];
    } else {
        throw new Error('The enum object had no property matching the value.');
    }
}

export function isKeyOf<T>(value: string|number|symbol,
    enumObj: T): value is keyof T {
    return value in enumObj;
}
