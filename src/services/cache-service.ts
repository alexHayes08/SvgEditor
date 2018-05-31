export class CacheService<T extends object> {
    //#region Fields

    private readonly _cache: Map<T, any>;
    private readonly _expirations: Map<T, Date>;

    //#endregion

    //#region Ctor

    public constructor() {
        this._cache = new Map();
        this._expirations = new Map();
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

    public forEach(callbackfn: (value: any, 
        key: T, 
        map: Map<T, any>) => void, thisArg?: any): void
    {
        this._cache.forEach(callbackfn);
    }

    public get<U>(key: T, setter?: () => U): U|undefined {

        // Check expiration date if set
        let expirationDate = this._expirations.get(key)
        if (expirationDate) {
            if (expirationDate < new Date()) {
                this._cache.delete(key);
                this._expirations.delete(key);
            }
        }

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

    public set<U>(key: T, value: U, expirationDate?: Date): CacheService<T> {
        if (expirationDate) {

            // Verify the date is in the future
            if (expirationDate > new Date()) {
                this._expirations.set(key, expirationDate);
                this._cache.set(key, value);
            }
        } else {
            this._cache.set(key, value);
        }

        return this;
    }

    public delete(key: T): boolean {
        this._expirations.delete(key);
        return this._cache.delete(key);
    }

    //#endregion
}