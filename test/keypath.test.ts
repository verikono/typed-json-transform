import { assert } from 'chai';

import { check, contains, valueForKeyPath, merge, mergeValueAtKeypath, flatObject, allKeyPaths, setValueForKeyPath, unsetKeyPath, keyPaths } from '../src';

import { makeA, makeB, makeC, makeD, makeZ } from './fixtures';

describe('keyPaths', () => {
    it('allKeyPaths', () => {
        const object = {
            a: {
                c: 'here\'s a thing'
            },
            b: [
                'd', 1, { regexSimple: /foobar/, regexModifiers: /foobar/im },
            ]
        };
        const kps = keyPaths(object, { allLevels: true, diffArrays: true });
        const list = ['a', 'b', 'b.0', 'b.1', 'b.2', 'b.2.regexSimple', 'b.2.regexModifiers'];
        for (const s of list) {
            assert.ok(contains(kps, s) == 1, `no keypath ${s} in ${kps}`);
        }
    });

    it('valueForKeyPath', () => {
        const testObj = makeZ(new Date());
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
