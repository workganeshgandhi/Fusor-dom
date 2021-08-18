import {Child, some, isFunction, isLiteral} from '@perform/common';

import {Renderer, ChildUpdater} from '../types';

// includes undefined, true because of ||
const isSkipable = (v: unknown) => v === false || v == null || v === '' || v === true;

type RenderedChild = Child<Renderer> | ReturnType<Renderer>;

type Setter = (parentNode: Node, child: RenderedChild, prevNode: Node) => Node;

const initComponent: Setter = (parentNode, child) => {
  parentNode.appendChild(child as Node);
  return child as Node;
};

const updateComponent: Setter = (parentNode, child, prevNode) => {
  parentNode.replaceChild(child as Node, prevNode);
  return child as Node;
};

const initLiteral: Setter = (parentNode, child) => {
  const text = document.createTextNode(child as string);
  parentNode.appendChild(text);
  return text;
}

const updateLiteral: Setter = (parentNode, child, prevNode) => {
  const text = document.createTextNode(child as string);
  parentNode.replaceChild(text, prevNode);
  return text;
}

const update = (
  callback: () => Child<Renderer>, parentNode: Node,
  prevChild: RenderedChild, prevNode: Node,
  component: Setter, literal: Setter, recursed = 0,
): [prevChild: RenderedChild, prevNode: Node] => {
  let child: RenderedChild = callback();

  if (child instanceof HTMLElement) { // component renderer
    if (prevChild !== child) prevNode = component(parentNode, child, prevNode);
  }
  else if (isSkipable(child)) { // before: literal as '', function as null
    child = '';
    if (prevChild !== child) prevNode = literal(parentNode, child, prevNode);
  }
  else if (isLiteral(child)) {
    if (prevChild !== child) prevNode = literal(parentNode, child, prevNode);
  }
  else if (isFunction(child as some)) { // condition
    if (recursed === 5) throw new Error(`prevent indefinite loop: ${recursed++}`);
    return update(
      callback, parentNode,
      prevChild, prevNode,
      component, literal, recursed++
    );
  }
  else throw new Error(`unsupported child: ${callback}`);

  prevChild = child;

  return [prevChild, prevNode]
};

const createUpdater = (
  callback: () => Child<Renderer>, parentNode: Node,
) => {
  let prevChild: RenderedChild;
  let prevNode: Node;

  // init
  [prevChild, prevNode] = update(
    callback, parentNode,
    prevChild, prevNode!, // we do not use prevNode on init...
    initComponent, initLiteral
  );

  return () => {
    // update
    [prevChild, prevNode] = update(
      callback, parentNode,
      prevChild, prevNode,
      updateComponent, updateLiteral
    );
  };
};

export const initChildren = (
  parent: HTMLElement, children: Child<Renderer>[], startIndex = 0
) => {
  let updaters: ChildUpdater[] | undefined, index = startIndex;

  for (const {length} = children; index < length; index ++) {
    const child = children[index];

    if (isSkipable(child)) { // before: literal as '', function as null
      // Do nothing, I love that! :)
    }
    else if (isLiteral(child)) {
      parent.append(child as string);
    }
    else if (isFunction(child as some)) { // dynamic value
      updaters ??= [];
      updaters.push(createUpdater(child as () => Child<Renderer>, parent));
    }
    else throw new TypeError(`unsupported child type: ${typeof child}`);
  }

  return updaters;
};
