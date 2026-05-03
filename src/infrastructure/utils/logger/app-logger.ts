import pino from "pino";

export class AppLogger {
  private logger = pino({ level: "info" });

  info(msg: string, data?: object) {
    this.logger.info(data ?? {}, msg);
  }

  error(msg: string, err?: unknown) {
    this.logger.error(err ?? {}, msg);
  }

  warn(msg: string, data?: object) {
    this.logger.warn(data ?? {}, msg);
  }
}
