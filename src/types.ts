type Primitive = string | number | boolean | symbol | null | undefined;

export type StaticProp = Primitive;

export type StaticChild = Primitive | Element;

export interface StaticProps {
  // [key: `on${string}`]: Function; // todo event handlers should be static
  [key: string]: StaticProp;
}

export type StaticArg = StaticProps | StaticChild;

export type Prop = StaticProp | Function;

export type Child<E extends Element> = StaticChild | Function | Component<E>;

export interface Props {
  [key: string]: Prop;
}

export type Arg<E extends Element> = Props | Child<E>;

export interface Updater {
  (): void;
}

export type ChildUpdater<E extends Element> = Updater | Component<E>;

// elementary-js/dom-component
// dom-element-component
// DomElementUpdater
export class Component<E extends Element> {
  constructor(
    private element: E,
    private propUpdaters?: readonly Updater[],
    private childUpdaters?: readonly ChildUpdater<E>[],
  ) {}

  getElement() {
    return this.element;
  }

  update() {
    const {propUpdaters, childUpdaters} = this;

    if (propUpdaters) {
      for (const u of propUpdaters) {
        u();
      }
    }

    if (childUpdaters) {
      for (const u of childUpdaters) {
        if (u instanceof Component) u.update();
        else u();
      }
    }
  }
}
