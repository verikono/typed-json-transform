import { assert } from 'chai';

import { check, contains, valueForKeyPath, mergeValueAtKeypath, flatObject, allKeyPaths, setValueForKeyPath, unsetKeyPath } from '../src';

import { makeA, makeB, makeC, makeD, makeZ } from './fixtures';

describe('keyPaths', () => {
    it('allKeyPaths', () => {
        const object = {
            a: {
                c: 'here\'s a thing'
            },
            b: {
                d: [1]
            }
        };
        const keypaths = allKeyPaths(object);
        const list = ['a', 'b', 'a.c', 'b.d'];
        for (const s of list) {
            assert.ok(contains(keypaths, s), `contains ${s}`);
        }
    });

    it('valueForKeyPath', () => {
        const testObj = makeZ();
        const res = valueForKeyPath('a.b.c', testObj);
        assert.equal(res, testObj.a.b.c);
        const seven = valueForKeyPath('z.2.seven', testObj);
        assert.equal(seven, (<any>testObj.z[2]).seven);
    });

    it('setValueForKeyPath', () => {
        const obj: any = {};
        setValueForKeyPath(0, 'a.b.c', obj);
        assert.equal(0, obj.a.b.c);
        assert.deepEqual(obj, makeD());
    });

    it('mergeValueAtKeypath', () => {
        const obj: any = makeD();
        mergeValueAtKeypath({ d: 1 }, 'a.b', obj);
        assert.equal(1, obj.a.b.d);
        assert.deepEqual(obj, {
            a: {
                b: {
                    d: 1,
                    c: 0
                }
            }
        });
    });

    it('unsetKeyPath mutates', () => {
        const testObj = makeD();
        unsetKeyPath('a.b.c', testObj);
        assert.deepEqual(testObj, makeC());
    });
});

describe('flatObject', function () {
    it('flatObject', () => {
        const flat = flatObject(makeD());
        assert.deepEqual(flat, { 'a.b.c': 0 });
    });

    it('flatObject {includeBranches: true}', () => {
        const flat = flatObject(makeD(), { includeBranches: true });
        assert.deepEqual(flat, {
            'a.b.c': 0,
            'a.b': {
                c: 0
            },
            a: {
                b: {
                    c: 0
                }
            }
        });
    });
});