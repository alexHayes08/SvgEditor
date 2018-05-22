export class CacheService<T extends object, U> {
    //#region Fields

    private readonly _cache: Map<T, U>;

    //#endregion

    //#region Ctor

    public constructor() {
        // super();
        this._cache = new Map();
    }

    //#endregion

    //#region Properties

    public get size(): number {
        return this._cache.size;
    }

    //#endregion

    //#region Functions

    public clear(): void {
        this._cache.clear();
    }

    public forEach(callbackfn: (value: U, 
        key: T, 
        map: Map<T, U>) => void, thisArg?: any): void
    {
        this._cache.forEach(callbackfn);
    }

    public get(key: T, setter?: () => U): U|undefined {
        let result = this._cache.get(key);

        if (result == undefined && setter != undefined) {
            result = setter();
            this._cache.set(key, result);
        }
        
        return result;
    }

    public has(key: T): boolean {
        return this._cache.has(key);
    }

    public set(key: T, value: U): CacheService<T,U> {
        this._cache.set(key, value);
        return this;
    }

    public delete(key: T): boolean {
        return this._cache.delete(key);
    }

    //#endregion
}