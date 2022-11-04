import * as puppeteer from 'puppeteer';
import { IBrowser } from '../interfaces';

class PuppeteerWrapper implements IBrowser {
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;
  private defaultWaitForOptions: puppeteer.WaitForOptions;

  constructor() {
    this.defaultWaitForOptions = {
      waitUntil: "domcontentloaded",
      timeout: 0,
    };
  }

  async init(
    options: puppeteer.LaunchOptions &
      puppeteer.BrowserLaunchArgumentOptions &
      puppeteer.BrowserConnectOptions & {
        product?: puppeteer.Product;
        extraPrefsFirefox?: Record<string, unknown>;
      } = {
      headless: true,
      defaultViewport: null,
      userDataDir: "./tmp",
    }
  ) {
    this.browser = await puppeteer.launch(options);
    this.page = await this.browser.newPage();
  }

  async goto(url: string) {
    if (!this.page) {
      await this.init();
    }
    await this.page.goto(url, this.defaultWaitForOptions);
  }

  async waitComponent(selector: string) {
    await this.page.waitForSelector(selector, this.defaultWaitForOptions);
  }
  
  async waitNavigate() {
    await this.page.waitForNavigation(this.defaultWaitForOptions);
  }

  async type(selector: string, value: string) {
    await this.page.type(selector, value);
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async setDefaultWaitForOptions(options: puppeteer.WaitForOptions) {
    this.defaultWaitForOptions = options;
  }

  async close() {
    await this.browser.close();
  }

  async manipulate<T>(selector: string, callback: (element: Element, ...args: unknown[]) => T | Promise<T>, ...args) {
    return this.page.$eval<T>(selector, callback, ...args);
  }

  async manipulateAll<T>(selector: string, callback: (element: Element[], ...args: unknown[]) => T | Promise<T>, ...args) {
    return this.page.$$eval<T>(selector, callback, ...args);
  }
}

export default PuppeteerWrapper;