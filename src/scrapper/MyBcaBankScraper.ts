import { BankTransaction, IBrowser } from "../interfaces";
import { BaseBankScraper } from "../bases";
import * as puppeteer from "puppeteer";
import {
  LaunchOptions,
  BrowserLaunchArgumentOptions,
  BrowserConnectOptions,
  Product,
} from "puppeteer";
import * as crypto from "crypto";
import { helper } from "../utils";
import { PuppeteerWrapper } from "../browser";

class MyBcaBankScrapper extends BaseBankScraper {
  private userId: string;
  private pass: string;
  private browser: IBrowser;
  private hasLoggedIn: boolean;

  private readonly BANK_CODE = "BCA";

  private readonly loginUrl = "https://mybca.bca.co.id/auth/login";
  private readonly inputUnameSelector = "input[name='username']";
  private readonly inputPassSelector = "input[name='password']";
  private readonly submitBtnSelector = "button[type=submit]";

  private readonly dashboardUrl = "https://mybca.bca.co.id/dashboard";
  private readonly balanceCardSelector = "app-dashboard-card-balance";
  private readonly innerUnlockSaldoSelector =
    "> app-card > app-card-body > div > a";
  private readonly innerSelectorSaldo = "h5";

  private readonly transactionUrl = "https://mybca.bca.co.id/profile/statement";
  private readonly transactionTableSelector = "table";
  private readonly accNumSelector = "app-form-group span.font-weight-semibold";
  private readonly durationInput = "input[name='duration']";
  private readonly curYearOptionBtnSelector =
    "bs-datepicker-navigation-view > button.current";
  private readonly btnNavSelector = "bs-datepicker-navigation-view > button.";
  private readonly tableYearSelector = "table.years";
  private readonly tableMonthSelector = "table.months";
  private readonly tableDaySelector = "table.days.weeks";
  private readonly submitTransactionBtnSelector = "button[type=submit]";

  private readonly dateRangeSelector = "app-daterangepicker";
  private readonly innerYearSelector =
    "section > app-bottom-sheet > div > div.sheet-content > app-card > app-card-body > bs-daterangepicker-inline > bs-daterangepicker-inline-container > div > div > div > div > bs-days-calendar-view > bs-calendar-layout > div.bs-datepicker-head > bs-datepicker-navigation-view > button:nth-child(3)";

  private readonly logoutUrl = "https://mybca.bca.co.id/dashboard";
  private readonly btnLogoutSelector =
    "app-header > header > nav > div > div > ul > li:nth-child(3) > a";

  constructor(userId: string, pass: string) {
    super();
    this.userId = userId;
    this.pass = pass;
    this.hasLoggedIn = false;
  }

  setDefaultWaitForOptions(options) {
    this.browser.setDefaultWaitForOptions(options);
  }

  async initBrowser(
    options: LaunchOptions &
      BrowserLaunchArgumentOptions &
      BrowserConnectOptions & {
        product?: Product;
        extraPrefsFirefox?: Record<string, unknown>;
      } = {
      headless: false,
      defaultViewport: null,
      userDataDir: "./tmp",
    }
  ) {
    this.browser = new PuppeteerWrapper();
    await this.browser.init(options);
    this.browser.setDefaultWaitForOptions({
      waitUntil: "domcontentloaded",
      timeout: 0,
    });
  }

  async login(): Promise<void> {
    if (!this.browser) {
      await this.initBrowser();
    }

    await this.browser.goto(this.loginUrl);
    await Promise.all([
      await this.browser.waitComponent(this.inputUnameSelector),
      await this.browser.waitComponent(this.inputPassSelector),
      await this.browser.waitComponent(this.submitBtnSelector),
    ])

    await Promise.all([
      await this.browser.type(this.inputUnameSelector, this.userId),
      await this.browser.type(this.inputPassSelector, this.pass),
    ])

    await this.browser.click(this.submitBtnSelector);
    await this.browser.waitNavigate();

    this.hasLoggedIn = true;
  }
  async getCurrentBalance(): Promise<number> {
    if (!this.hasLoggedIn) {
      await this.login();
    }

    await this.browser.goto(this.dashboardUrl);

    await this.browser.waitComponent(
      this.balanceCardSelector + " " + this.innerUnlockSaldoSelector
    );
    await this.browser.manipulate(
      this.balanceCardSelector + " " + this.innerUnlockSaldoSelector,
      (el: HTMLElement) => {
        el.click();
      }
    );

    await this.browser.waitComponent(
      this.balanceCardSelector + " " + this.innerSelectorSaldo
    );
    const saldo = await this.browser.manipulate(
      this.balanceCardSelector + " " + this.innerSelectorSaldo,
      (el: HTMLElement) => {
        return parseInt(el.innerText.trim().replace(/[^0-9]/g, ""));
      }
    );

    return saldo;
  }
  async getTransactions(
    startAt: Date,
    endAt: Date
  ): Promise<BankTransaction[]> {
    if (!this.hasLoggedIn) {
      await this.login();
    }

    await this.browser.goto(this.transactionUrl);

    if (startAt && endAt) {
      await this.browser.waitComponent(this.durationInput);
      await this.browser.manipulate(this.durationInput, (el: HTMLElement) => {
        el.click();
      });

      await this.chooseDate(startAt, true);
      await this.chooseDate(endAt, false);

      await this.browser.waitComponent(this.submitTransactionBtnSelector);
      await this.browser.manipulateAll(
        this.submitTransactionBtnSelector,
        (els: HTMLElement[]) => {
          els.forEach((el) => {
            el.click();
          });
        }
      );
    }

    await this.browser.waitComponent(this.transactionTableSelector);
    const transactions = await this.browser.manipulate(
      this.transactionTableSelector,
      (el) => {
        const tbody = el.querySelector("tbody");
        const trs = Array.from(tbody.querySelectorAll("tr"));

        const res = trs.map((tr) => {
          const tds = Array.from(tr.querySelectorAll("td"));
          const credit = tds[2].classList.contains("text-danger");

          const date = tds[0].innerText;
          const description = tds[1].innerText;
          const amount = parseInt(tds[2].innerText.replace(/[^0-9]/g, ""));
          const type = credit ? "CR" : "DB";

          return {
            date,
            description,
            amount,
            type,
          };
        });

        return res;
      }
    );

    await this.browser.waitComponent(this.accNumSelector);
    const accNum = await this.browser.manipulate(
      this.accNumSelector,
      (el: HTMLElement) => {
        return el.innerText.trim();
      }
    );

    const bankTransactions = transactions.map((trx) => {
      const trxMap: BankTransaction = {
        bankCode: this.BANK_CODE,
        accountNum: accNum,
        transactionDate: this.formatterDateBca(trx.date),
        transactionType: trx.type as "CR" | "DB",
        transactionAmount: trx.amount,
        transactionName: trx.description,
        externalId: "",
      };

      const concatStr = `${trxMap.bankCode}${trxMap.accountNum}${trxMap.transactionDate}${trxMap.transactionType}${trxMap.transactionAmount}${trxMap.transactionName}`;
      const hash = crypto.createHash("md5").update(concatStr).digest("hex");
      trxMap.externalId = hash;

      return trxMap;
    });

    return bankTransactions;
  }
  async logout(): Promise<void> {
    if (!this.hasLoggedIn) {
      return;
    }

    await this.browser.goto(this.logoutUrl);
    await this.browser.waitComponent(this.btnLogoutSelector);
    await this.browser.manipulate(this.btnLogoutSelector, (a: HTMLElement) => {
      a.click();
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async chooseDate(date: Date, isStart: boolean) {
    await this.browser.waitComponent(this.dateRangeSelector);
    await this.browser.waitComponent(
      this.dateRangeSelector + " " + this.innerYearSelector
    );
    await this.browser.manipulate(
      this.dateRangeSelector + " " + this.innerYearSelector,
      (el: HTMLElement) => {
        el.click();
      }
    );

    await this.browser.waitComponent(this.curYearOptionBtnSelector);
    const curYearOption = await this.browser.manipulate(
      this.curYearOptionBtnSelector,
      (el: HTMLElement) => {
        return el.innerText;
      }
    );

    let curYearStart = parseInt(curYearOption.split(" - ")[0]);
    let curYearEnd = parseInt(curYearOption.split(" - ")[1]);

    const curDate = helper.decomposeDate(date);
    while (true) {
      if (isStart && curYearStart <= curDate.year) {
        break;
      }

      if (!isStart && curYearEnd >= curDate.year) {
        break;
      }

      await this.browser.waitComponent(
        this.btnNavSelector +
          (isStart ? "previous" : "next")
      );
      const btnNav = await this.browser.manipulate(
        this.btnNavSelector + (isStart ? "previous" : "next"),
        (el: HTMLElement) => {
          if (el.getAttribute("disabled") === null) {
            el.click();
            return true;
          } else {
            return false;
          }
        }
      );

      if (!btnNav) {
        throw new Error("Cannot find previous year button");
      }

      await this.browser.waitComponent(
        this.curYearOptionBtnSelector
      );
      const curYearOptionInner = await this.browser.manipulate(
        this.curYearOptionBtnSelector,
        (el: HTMLElement) => {
          return el.innerText;
        }
      );

      curYearStart = parseInt(curYearOptionInner.split(" - ")[0]);
    }

    const curDateYear = curDate.year;
    await this.browser.waitComponent(this.tableYearSelector);
    await this.browser.manipulate(
      this.tableYearSelector,
      (el: HTMLElement, curDateYear) => {
        const trs = Array.from(el.querySelectorAll("tbody tr"));
        const tds = trs.map((tr) => {
          return Array.from(tr.querySelectorAll("td"));
        });
        const flatTds = tds.flat();
        const selectedYear = flatTds.find((td) => {
          if (parseInt(td.innerText) === curDateYear) {
            return true;
          }
        });
        selectedYear.click();
      },
      curDateYear
    );

    await this.browser.waitComponent(this.tableMonthSelector);
    await this.browser.manipulate(
      this.tableMonthSelector,
      (el: HTMLElement, monthName: string) => {
        const trs = Array.from(el.querySelectorAll("tbody tr"));
        const tds = trs.map((el) => {
          return Array.from(el.querySelectorAll("td"));
        });
        const flatTds = tds.flat();
        const res = flatTds.find((el: HTMLElement) => {
          if (
            el.innerText.trim() === monthName &&
            !el.classList.contains("disabled")
          ) {
            return true;
          }
        });
        if (!res) {
          throw new Error("Cannot find month");
        }
        res.click();
      },
      curDate.monthName
    );

    await this.browser.waitComponent(this.tableDaySelector);
    await this.browser.manipulate(
      this.tableDaySelector,
      (el: HTMLElement, day: number) => {
        const trs = Array.from(el.querySelectorAll("tbody tr"));
        const tds = trs.map((el) => {
          return Array.from(el.querySelectorAll("td"));
        });
        const flatTds = tds.flat();
        const res = flatTds.find((el: HTMLElement) => {
          if (
            el.innerText.trim() === day.toString() &&
            !el.querySelector("span.disabled")
          ) {
            return true;
          }
        });
        if (!res) {
          throw new Error("Cannot find day");
        }
        res.querySelector("span").click();
      },
      curDate.day
    );
  }

  private formatterDateBca(dateStr: string) {
    const splitted = dateStr.split("/");
    const year = new Date().getFullYear();
    const month = splitted[1];
    const day = splitted[0];

    return new Date(`${year}-${month}-${day}`);
  }
}

export default MyBcaBankScrapper;
