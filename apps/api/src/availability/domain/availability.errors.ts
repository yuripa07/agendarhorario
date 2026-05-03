export class AvailabilityBlockNotFoundError extends Error {
  constructor() {
    super("Availability block not found");
    this.name = "AvailabilityBlockNotFoundError";
  }
}
