class Helper {
  public readonly monthsIdn = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  public decomposeDate(date: Date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      monthName: this.monthsIdn[date.getMonth()],
      day: date.getDate(),
    };
  }

  public sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

export default new Helper();
