import { BankTransaction } from '../interfaces';

abstract class BaseBankScraper {
  abstract login(): Promise<void>;
  abstract getCurrentBalance(): Promise<number>;
  abstract getTransactions(
    startAt: Date,
    endAt: Date
  ): Promise<BankTransaction[]>;
  abstract logout(): Promise<void>;
}

export default BaseBankScraper;