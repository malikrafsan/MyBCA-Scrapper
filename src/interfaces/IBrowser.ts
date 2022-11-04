interface IBrowser {
  init: (options?: any) => Promise<void>;
  goto: (url: string) => Promise<void>;
  waitComponent: (selector: string) => Promise<void>;
  waitNavigate: () => Promise<void>;
  type: (selector: string, value: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  setDefaultWaitForOptions: (options: any) => Promise<void>;
  close: () => Promise<void>;
  manipulate: <T>(
    selector: string,
    callback: (element: Element, ...args: unknown[]) => T | Promise<T>,
    ...args
  ) => Promise<any>;
  manipulateAll: <T>(
    selector: string,
    callback: (element: Element[], ...args: unknown[]) => T | Promise<T>,
    ...args
  ) => Promise<any>;
}

export default IBrowser;
