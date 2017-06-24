import { assert } from 'chai';
import { check, modifierToObj, diffToModifier, forwardDiffToModifier, apply } from '../src';
import { makeA, makeB, makeC, makeD, makeZ } from './fixtures';

interface Modifier {
  $set?: any,
  $unset?: any
}

describe('diff', () => {
  it('modifierToObj', () => {
    const modifier: Modifier = {};
    modifier.$set = {
      'array.4': '5th element'
    };
    modifier.$unset = {
      emptyObject: undefined
    };
    const obj: any = modifierToObj(modifier);
    assert.equal(obj.array[4], '5th element');
    assert.equal(obj.emptyObject, undefined);
  });

  it('modifier', () => {
    const testObj = makeA();
    const modifier = diffToModifier(testObj, makeB());
    assert.deepEqual(testObj, makeA());
    assert.deepEqual(modifier, {
      $set: {
        c: 'd',
        e: 'f'
      },
      $unset: {
        a: true
      }
    });
  });

  it('forwardModifier', () => {
    const testObj = makeA();
    const modifier = forwardDiffToModifier(testObj, makeB());
    assert.deepEqual(testObj, makeA());
    assert.deepEqual(modifier, {
      $set: {
        c: 'd',
        e: 'f'
      }
    });
  });

  it('apply', () => {
    const testObj = makeA();
    const modifier = diffToModifier(testObj, makeB());
    apply(testObj, modifier);
    assert.deepEqual(testObj, <any>makeB());
  });

  return it('apply (complex)', () => {
    const messA = {
      string: 'alpha',
      nestedA: {
        array: [
          1,
          2,
          3, {
            nO1: 'v1',
            nA: [0, 1, 2]
          },
          [3, 2, 1]
        ],
        nestedB: {
          string: 'beta',
          array: [
            3,
            2, {
              nO1: 'v2',
              nA: [0, 2]
            }, {
              anotherKey: true
            },
            [
              1,
              2,
              [
                1, {
                  two: 2
                }
              ]
            ]
          ]
        }
      }
    };
    const messB = {
      nestedA: {
        array: [
          3,
          2, {
            nO1: 'v2',
            nA: [0, 2]
          }, {
            anotherKey: true
          },
          [
            1,
            2,
            [
              1, {
                two: 2
              }
            ]
          ]
        ],
        nestedB: {
          array: [
            1,
            2,
            3, {
              nO1: 'v1',
              nA: [0, 1, 2]
            },
            [3, 2, 1]
          ],
          string: 'it\'s a delta'
        }
      }
    };

    const modifier = diffToModifier(messA, messB);
    apply(messA, modifier);
    assert.deepEqual(messA, <any>messB, `failed with modifier ${JSON.stringify(modifier, [], 2)}`);
  });
});
