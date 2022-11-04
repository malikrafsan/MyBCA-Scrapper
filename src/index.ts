import { MyBcaBankScrapper } from "./scrapper";
import { logger } from "./utils";
import * as dotenv from "dotenv";
import * as fs from "fs";

const main = async () => {
  dotenv.config();

  const USER_ID = process.env.USER_IDENTIFIER;
  const PASS = process.env.PIN_PASSWORD;

  logger.log("Starting scrapper for user: " + USER_ID);

  // start and end dates get transactions
  const startDate = new Date("2022-10-21");
  const endDate = new Date();
  logger.log(`Start date: ${startDate} - End date: ${endDate}`);

  const myBcaBankScrapper = new MyBcaBankScrapper(USER_ID, PASS);
  try {
    await myBcaBankScrapper.initBrowser({
      headless: false,
    });
    logger.log("Browser initialized");

    await myBcaBankScrapper.login();
    logger.log("Login success");
    
    const saldo = await myBcaBankScrapper.getCurrentBalance();
    logger.log("Current balance: " + saldo);
    
    const transactions = await myBcaBankScrapper.getTransactions(startDate, endDate);
    logger.log("Transactions length: " + transactions.length);
    
    await myBcaBankScrapper.logout();
    logger.log("Logout success");
    
    await myBcaBankScrapper.close();
    logger.log("Browser closed");

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
    logger.log("Scrapped data saved to data/scapped.json");
  } catch (error) {
    logger.log(error);
    await myBcaBankScrapper.close();
  }
}

main();
