import { BankTransaction } from '../interfaces';

abstract class BaseBankScraper {
	abstract login(): void;
	abstract getCurrentBalance(): number;
	abstract getTransactions(startAt: Date, endAt: Date): BankTransaction[];
	abstract logout(): void;
}

export default BaseBankScraper;