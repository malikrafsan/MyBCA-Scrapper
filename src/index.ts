import { MyBcaBankScrapper } from "./scrapper";
import { logger } from "./utils";
import * as dotenv from "dotenv";
import * as fs from "fs";

const main = async () => {
  dotenv.config();

  const USER_ID = process.env.USER_IDENTIFIER;
  const PASS = process.env.PIN_PASSWORD;

  const startDate = new Date("2022-10-21");
  const endDate = new Date();

  const myBcaBankScrapper = new MyBcaBankScrapper(USER_ID, PASS);
  try {
    await myBcaBankScrapper.initBrowser();
    await myBcaBankScrapper.login();
    const saldo = await myBcaBankScrapper.getCurrentBalance();
    logger.log(`Saldo: ${saldo}`);
    const transactions = await myBcaBankScrapper.getTransactions(startDate, endDate);
    logger.log(`Transactions: ${JSON.stringify(transactions)}`);
    await myBcaBankScrapper.logout();
    await myBcaBankScrapper.close();

    const res = {
      userId: USER_ID,
      saldo,
      transactions,
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString(),
    }
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data");
    }

    fs.writeFileSync("data/scapped.json", JSON.stringify(res, null, 2));
  } catch (error) {
    logger.log(error);
    await myBcaBankScrapper.close();
  }
}

main();
