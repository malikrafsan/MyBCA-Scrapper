import { BankTransaction } from "../interfaces";
import { BaseBankScraper } from "../bases";

class KlikBcaBankScrapper extends BaseBankScraper {
    login(): void {
        throw new Error("Method not implemented.");
    }
    getCurrentBalance(): number {
        throw new Error("Method not implemented.");
    }
    getTransactions(startAt: Date, endAt: Date): BankTransaction[] {
        throw new Error("Method not implemented.");
    }
    logout(): void {
        throw new Error("Method not implemented.");
    }
}

export default KlikBcaBankScrapper;
