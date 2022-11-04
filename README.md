# MyBCA-Scrapper

## Objective
Scrape data from an internet banking site using MyBCA (Web)

## Task
Create a class <ibanking_name>BankScraper (e.g. MyBcaBankScraper) that inherits from BaseBankScraper to scrap user’s transaction from the internet banking site. Please use TypeScript and Puppeteer.
```ts
interface BankTransaction {
  bankCode: string;
  accountNum: string;
	transactionDate: DateTime;
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

abstract class BaseBankScraper {
	abstract login()
	abstract getCurrentBalance(): number
	abstract getTransactions(startAt: Date, endAt: Date): []BankTransaction
	abstract logout()
}
```

## Dependencies
- Node JS [v14.18.0]
- Yarn [1.22.19]

## Setup
- Clone this repository
- Copy `.env.example` to `.env` file
- Fill `.env` file credential
- Install node packages
    ```
    yarn install
    ```

## How To Run
```sh
yarn bstart           # if you use unix system
yarn bstart-windows   # if you use windows system
```

## Developed by
- Malik Akbar Hashemi Rafsanjani
- 13520105@std.stei.itb.ac.id
