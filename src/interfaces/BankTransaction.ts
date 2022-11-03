interface BankTransaction {
    bankCode: string;
    accountNum: string;
    transactionDate: Date;
    transactionType: "CR" | "DB"; // credit or debit
    transactionAmount: number;
    transactionName: string;

    // Unique identifier for each trx. Generated from the md5 hash of a
    // string concatenation of:
    //   - bankCode
    //   - accountNum
    //   - transactionDate
    //   - transactionType
    //   - transactionAmount
    //   - transactionName
    externalId: string;
}

export default BankTransaction;