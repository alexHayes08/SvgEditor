export class NotImplementedError extends Error {
  constructor() {
    super();
    this.message = "Not yet implemented.";
  }
}

export class InvalidCastError extends Error {
  constructor() {
    super();
    this.message = "Failed to cast object.";
  }
}

export class InternalError extends Error {
  constructor() {
    super();
    this.message = "An internal error occurred.";
  }
}