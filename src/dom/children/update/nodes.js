
// todo refactor with diff
// todo rename to diffChildren
// ? rendering plugin

export const updateNodes = (parentNode, prevNodes, nextNodes) => {
  const prevLength = prevNodes?.length ?? 0;
  const nextLength = nextNodes?.length ?? 0;

  let i = 0;

  // update
  for (const minLength = Math.min(prevLength, nextLength); i < minLength; i ++) {
    const p = prevNodes[i];
    const n = nextNodes[i];

    if (p !== n)
      p.replaceWith(n);
  }

  if (prevLength !== nextLength) {
    // create
    if (prevLength < nextLength) {
      for (; i < nextLength; i ++)
        parentNode.append(nextNodes[i]);
    }
    // delete
    else if (prevLength > nextLength) {
      for (; i < prevLength; i ++)
        prevNodes[i].remove();
    }
  }
};
