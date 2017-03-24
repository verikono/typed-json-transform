import { check, isArguments, isEmpty, isUndefinedOrNull, isBuffer } from './check';
import { decycle, retrocycle } from './decycle';

interface SIO { [index: string]: any }

export function each<T>(iter: { [index: string]: T } | T[], fn: (val: T, index?: string | number, breakLoop?: () => void) => void): void {
    let broken = 0;
    const breakLoop = (() => { broken = 1; })

    if (check(iter, Array)) {
        let index = 0;
        for (const v of <T[]>iter) {
            fn(v, index, breakLoop);
            if (broken) {
                return;
            }
            index++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            fn((<{ [index: string]: T }><any>iter)[k], k, breakLoop);
            if (broken) {
                return;
            }
        }
    }
}

export function extend<A, B>(target: A & SIO, source: B & SIO): A & B {
    if (check(source, Object)) {
        for (const key of Object.keys(source)) {
            if (check(source[key], Object) && check(target[key], Object)) {
                extend(target[key], source[key]);
            } else {
                target[key] = clone(source[key]);
            }
        }
    }
    return <A & B>target;
}

export function extendN<T>(target: T & SIO, ...sources: Array<SIO>): T {
    for (const source of sources) {
        if (check(source, Object)) {
            for (const key of Object.keys(source)) {
                if (check(source[key], Object) && check(target[key], Object)) {
                    extend(target[key], source[key]);
                } else {
                    target[key] = clone(source[key]);
                }
            }
        }
    }
    return <T>target;
}

export function assign<A, B>(a: A, b: B): A & B {
    let result = clone(a);
    return extend(result, b);
}

export function combine<A, B>(a: A, b: B): A & B {
    let result = clone(a);
    return extend(result, b);
}

export function combineN<T>(retType: T, ...args: SIO[]): T {
    const result = clone(retType);
    for (const dict of args) {
        if (check(dict, Object)) {
            extend(result, dict);
        }
    }
    return result;
}

export function any(iterable: Array<any>, fn: Function): boolean {
    for (const v of iterable) {
        if (fn(v) !== false) {
            return true;
        }
    }
    return false;
}

export function every<T>(iterable: any[], fn: Function): boolean {
    for (const v of iterable) {
        if (fn(v) === false) {
            return false;
        }
    }
    return true;
}

export function map<R, I>(iter: { [index: string]: I } | I[], fn: (val: I, index: any) => R): R[] {
    const res: R[] = [];
    if (check(iter, Array)) {
        let i = 0;
        for (const v of <I[]>iter) {
            res.push(fn(v, i));
            i++;
        }
    } if (check(iter, Object)) {
        for (const k of Object.keys(iter)) {
            res.push(fn((<{ [index: string]: I }>iter)[k], k));
        }
    }
    return res;
}

export function reduce<T, S>(input: Array<T>, fn: (input: T, memo: S) => S, base?: S): S
export function reduce<T, S>(input: { [index: string]: T }, fn: (input: T, memo: S) => S, base?: S): S {
    let sum: S = base;
    each(input, (value: T) => {
        sum = fn(value, sum)
    });
    return sum;
}

export function sum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number {
    let sum = 0;
    each(input, (value: T) => {
        sum = sum + fn(value);
    });
    return sum;
}

export function greatestResult<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number {
    let greatestResult = 0;
    each(input, (value: T) => {
        const res = fn(value)
        if (res > greatestResult) greatestResult = res;
    });
    return greatestResult;
}

export function sumIfEvery<T>(input: { [index: string]: T } | Array<T>, fn: (input: T) => number): number {
    let sum = 0;
    each(input, (value: T, index: any, breakLoop: Function) => {
        const res = fn(value);
        if (res > 0) {
            sum = sum + res;
        }
        else {
            sum = 0;
            breakLoop();
        }
    });
    return sum;
}

export function geoSum<T>(input: { [index: string]: T } | Array<T>, fn: (input: T, memo: number) => number): number {
    let sum = 1;
    each(input, (value: T, key: any, breakLoop: Function) => {
        sum *= fn(value, sum)
    });
    return sum;
}

export function union<T>(...args: T[][]): T[] {
    const res: T[] = [];
    for (const arr of args) {
        for (const v of arr) {
            if (!contains(res, v)) {
                res.push(v);
            }
        }
    }
    return res;
}

export function intersect<T>(...args: T[][]): T[] {
    const res = <T[]>[];
    for (const a of args) {
        for (const v of a) {
            if (!contains(res, v)) {
                for (const b of args) {
                    if (contains(b, v)) {
                        res.push(v);
                    }
                }
            }
        }
    }
    return res;
}

export function difference<T>(a: T[], b: T[]): T[] {
    const res = <T[]>[];
    for (const v of a) {
        if (!contains(b, v)) {
            res.push(v);
        }
    }
    return res;
}

export function contains<T>(set: any[], match: T): boolean {
    if (check(match, Array)) {
        return containsAny(set, match as any);
    }
    for (const val of set) {
        if (isEqual(val, match)) {
            return true;
        }
    }
    return false;
}

export function containsAny<T>(set: any[], match: any[]): boolean {
    if (!check(match, Array)) {
        throw new Error('contains all takes a list to match');
    }
    for (const val of match) {
        if (contains(set, val)) {
            return true;
        }
    }
    return false;
}

export function containsAll<T>(set: any[], match: any[]): boolean {
    if (!check(match, Array)) {
        throw new Error('contains all takes a list to match');
    }
    for (const val of match) {
        if (!contains(set, val)) {
            return false;
        }
    }
    return true;
}


interface ComparisonOptions {
    [index: string]: boolean;
    strict: boolean;
}

export function isEqual(actual: any, expected: any, opts?: ComparisonOptions): boolean {
    // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
    if (!opts) opts = <ComparisonOptions>{};
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
        return true;

    } else if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();

        // 7.3. Other pairs that do not both pass typeof value == 'object',
        // equivalence is determined by ==.
    } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
        return opts.strict ? actual === expected : actual == expected;

        // 7.4. For all other Object pairs, including Array objects, equivalence is
        // determined by having the same number of owned properties (as verified
        // with Object.prototype.hasOwnProperty.call), the same set of keys
        // (although not necessarily the same order), equivalent values for every
        // corresponding key, and an identical 'prototype' property. Note: this
        // accounts for both named and indexed properties on Arrays.
    } else {
        return _objEquiv(actual, expected, opts);
    }
}

const pSlice = Array.prototype.slice;

function _objEquiv(a: any, b: any, opts?: ComparisonOptions): boolean {
    var i, key;
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
        return false;
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype) return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
        if (!isArguments(b)) {
            return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return isEqual(a, b, opts);
    }
    if (isBuffer(a)) {
        if (!isBuffer(b)) {
            return false;
        }
        if (a.length !== b.length) return false;
        for (i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    try {
        var ka = Object.keys(a),
            kb = Object.keys(b);
    } catch (e) {//happens when one is a string literal and the other isn't
        return false;
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length)
        return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i])
            return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!isEqual(a[key], b[key], opts)) return false;
    }
    return typeof a === typeof b;
}

function _prune(input: SIO): boolean {
    if (!check(input, Object)) {
        throw new Error('attempting to _prune undefined object');
    }
    const ref = input;
    let pruned = false;
    for (const k of Object.keys(ref)) {
        const val = ref[k];
        if (check(val, Object)) {
            if (_prune(val)) {
                pruned = true;
            }
            if (isEmpty(val)) {
                delete ref[k];
                pruned = true;
            }
        }
    }
    return pruned;
}

export function prune<T>(obj: T): T {
    _prune(obj);
    return obj;
}

export function plain<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function clone<T>(input: T): T {
    return <T>retrocycle(decycle(input));
}

export function arrayify<T>(val: T | T[]): T[] {
    if (check(val, Array)) {
        return val as T[];
    }
    return [val as T];
}

export function okmap<T>(iterable: Object | Array<any>, fn: (v: any, k: string) => { [index: string]: T }): { [index: string]: T } {
    const sum = <{ [index: string]: T }>{};
    each(iterable, (v: any, k: any) => {
        const res = fn(v, k);
        const key = Object.keys(res)[0];
        sum[key] = res[key];
    });
    return sum;
}

export function stringify(value: any, replacer?: (number | string)[], space?: string | number): string {
    return JSON.stringify(decycle(value), replacer, space || 2);
}