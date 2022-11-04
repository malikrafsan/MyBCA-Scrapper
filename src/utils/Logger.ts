import * as fs from 'fs';

class Logger {
  private DIR_LOG_PATH = "logs";

  constructor() {
    if (!fs.existsSync(this.DIR_LOG_PATH)) {
      fs.mkdirSync(this.DIR_LOG_PATH);
    }
  }

  private getLogFile() {
    const todayLog = new Date().toDateString();
    return `${this.DIR_LOG_PATH}/${todayLog}.log`;
  }

  private addTimeStamp() {
    const date = new Date();
    return date.toLocaleString();
  }

  public format(message: string): string {
    const caller = (new Error().stack || "").split("\n")[3].replace("at", "").trim();
    return `[${this.addTimeStamp()}] - [${caller}] - [${message}]\n`;
  }

  public log(message: string) {
    const file = this.getLogFile();
    fs.appendFileSync(file, this.format(message));
  }
}

export default new Logger();
