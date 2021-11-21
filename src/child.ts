import {Evaluable, evaluate, getString} from '@perform/common';

import {Child, Updater} from './types';

const createUpdater = (callback: Evaluable<Child>, parentNode: Node): Updater => {
  // init
  let child: Child = '';
  let node: Node = document.createTextNode('');

  parentNode.appendChild(node);

  // update
  return () => {
    const nextChild: Child = evaluate(callback);

    if (nextChild === child) return;

    child = nextChild;

    if (nextChild instanceof Element) {
      parentNode.replaceChild(nextChild, node);
      node = nextChild;
    }
    else if (node instanceof Text) {
      node.nodeValue = getString(nextChild);
    }
    else {
      const nextNode = document.createTextNode(getString(nextChild));
      parentNode.replaceChild(nextNode, node);
      node = nextNode;
    }
  };
};

export const initChild = (parent: Element, child: Child) => {
  // dynamic
  if (typeof child === 'function') {
    return createUpdater(child as Evaluable<Child>, parent);
  }
  // static
  else if (child instanceof Element) {
    parent.append(child);
  }
  else {
    parent.append(getString(child));
    // do not optimize by concatenating serial static values to a single node
    // it should be done by the client code in upper scope
  }
};
