export class BlackFridayDatabaseError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "BlackFridayDatabaseError";
    this.status = status;
  }
}
