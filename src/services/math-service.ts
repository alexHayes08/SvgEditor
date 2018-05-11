const uniqid = require("uniqid");

function isMathOperation(data: any): data is MathOperation {
    return (data != undefined
        && data.value != undefined
        && data.add != undefined
        && data.subtract != undefined
        && data.multiply != undefined
        && data.divide != undefined);
}

export class MathOperation {
    //#region Fields

    private _sigFigs: number;
    private _value: number;

    //#endregion

    //#region Ctor

    constructor(value?: number) {
        this._sigFigs = 9;
        this._value = value || 0;
    }

    //#endregion

    //#region Functions

    private afterOperation() {
        this._value = Number(this._value.toPrecision(this._sigFigs));
    }

    public add(value: number|MathOperation): MathOperation {
        
        // Check if number or MathOperation
        if (isMathOperation(value)) {
            let mathOperation = value as MathOperation;
            this._value += mathOperation.value();
        } else {
            let num = value as number;
            this._value += num;
        }

        // Round according to sigFig
        this.afterOperation();
        return this;
    }

    public divide(value: number|MathOperation): MathOperation {

        // Check if number or MathOperation
        if (isMathOperation(value)) {
            let mathOperation = value as MathOperation;
            this._value /= mathOperation.value();
        } else {
            let num = value as number;
            this._value /= num;
        }

        // Round according to sigFig
        this.afterOperation()
        return this;
    }

    public multiply(value: number|MathOperation): MathOperation {

        // Check if number or MathOperation
        if (isMathOperation(value)) {
            let mathOperation = value as MathOperation;
            this._value *= mathOperation.value();
        } else {
            let num = value as number;
            this._value *= num;
        }

        // Round according to sigFig
        this.afterOperation()
        return this;
    }

    public subtract(value: number|MathOperation): MathOperation {

        // Check if number or MathOperation
        if (isMathOperation(value)) {
            let mathOperation = value as MathOperation;
            this._value -= mathOperation.value();
        } else {
            let num = value as number;
            this._value -= num;
        }

        // Round according to sigFig
        this.afterOperation();
        return this;
    }

    public apply(value: (val: number) => number): MathOperation {
        let result = value(this._value);
        
        this.afterOperation()
        return this;
    }

    public sigFigs(value: number): MathOperation {
        if (value <= 0) {
            throw new Error("Value cannot be less than or equal to zero.");
        }

        this.afterOperation()
        return this;
    }

    public value(): number {
        return this._value;
    }

    //#endregion
}

export class MathService {
    //#region Fields

    // private _activeOperations: WeakMap<MathOperation, String>;
    private _sigFigs: number;

    //#endregion
    
    //#region Ctor

    public constructor() {
        // this._activeOperations = new WeakMap();
        this._sigFigs = 9;
    }

    //#endregion

    //#region Properties

    get activeOperations(): MathOperation[] {
        let operations: MathOperation[] = [];

        return operations;
    }

    get sigFigs(): number {
        return this._sigFigs;
    }

    set sigFigs(value: number) {
        if (value <= 0) {
            throw new Error("Value cannot be less than or equal to zero.");
        }

        this._sigFigs = value;
    }

    //#endregion

    //#region Functions

    public newOp(value?: number) {
        return new MathOperation(value)
            .sigFigs(this._sigFigs);
    }

    //#endregion
}

// Create default service
const MathServiceSingleton = new MathService();
export { MathServiceSingleton };