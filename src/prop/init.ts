import {Props, isFunction, isEmptyProp, isObject, isLiteral} from '@perform/common';

type Key = string;
type Value = any;
type ValueType = string;

interface Action {
  (e: HTMLElement, k: Key, v: Value): void;
}

const createAttributeActionGetter = (literal: Action, boolean: Action) => (k: Key, v: Value, vT: ValueType) => {
  switch (vT) {
    case 'string': return literal;
    case 'number':
      if (v === NaN) throw new Error(`invalid attribute value: "${k}": ${v}`);
      return literal;
    case 'boolean': return boolean;
    default: throw new Error(`illegal attribute type: "${k}": ${v}`);
  }
};

const getAttributeSetterAction = createAttributeActionGetter(
  (e, k, v) => e.setAttribute(k, v),
  (e, k) => e.setAttribute(k, '')
);

const getPropertyUpdaterAction = createAttributeActionGetter(
  (e, k, v) => isEmptyProp(v) ? e.removeAttribute(k) : e.setAttribute(k, v),
  (e, k, v) => v ? e.removeAttribute(k) : e.setAttribute(k, '')
);

const updateInputProperty: Action = (e, k, v) => (e as Props)[k] = v;

const setInitialAttribute: Action = (e, k, v) => {
  getAttributeSetterAction(k, v, typeof v)(e, k, v);
};

const getPropertyUpdater = (e: HTMLElement, k: Key, v: Value, vT: ValueType) => {
  if (e.tagName === 'INPUT' && (k === 'value' || k === 'checked')) {
    return updateInputProperty;
  }

  return getPropertyUpdaterAction(k, v, vT);
};

const createPropertyUpdater = (e: HTMLElement, k: Key, f: () => Value, prev: Value, prevT: ValueType) => {
  const update = getPropertyUpdater(e, k, prev, prevT); // todo element could change maybe

  return () => {
    const v = f(), vT = typeof v;

    if (vT !== prevT && prev !== undefined && v !== undefined)
      throw new Error(`mismatch attribute types: "${k}" initial: ${prev} next: ${v}`);

    // console.log({prev, v}); // todo refactor prev

    if (prev === v) return;
    prev = v;
    prevT = vT;

    update(e, k, v);
  };
};

export const initProps = (element: HTMLElement, attributes: Readonly<Props>) => {
  let updaters;

  for (let [k, v] of Object.entries(attributes)) {
    if (isEmptyProp(v)) { // before: function as null, object as null
      // Do nothing, I love that! :)
    }
    else if (k.startsWith('on')) {
      if (isFunction(v)) element.addEventListener(k.substring(2).toLowerCase(), v, false);
      else throw new TypeError(`illegal property: ${k} value: ${v}`);
    }
    // todo data-
    // todo style
    // todo area-
    else if (k === 'ref') {
      if (isFunction(v)) v(element);
      else if (isObject(v)) v.current = element;
      else throw new TypeError(`illegal property: ${k} value: ${v}`);
    }
    else if (isLiteral(v)) {
      // ? maybe development check for correct attribute key=value ?
      element[k as 'id'] = v;
    }
    else {
      if (isFunction(v)) {
        const f = v;

        v = v();
        updaters ??= [];
        updaters.push(createPropertyUpdater(element, k, f, v, typeof v));
      }

      if (! isEmptyProp(v)) setInitialAttribute(element, k, v);
    }
  }

  return updaters;
};
