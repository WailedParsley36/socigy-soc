export enum AppState {
  Created = 1,
  Initialized = 2,

  Unauthorized = 4,
  Authorized = 8,
  NotRegistered = 16,
  MFA = 32,
  Offline = 64,

  Loading = 128,
}

export enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
}

export interface InitializationManagerInfo {
  id: string;
  state: AppState;
  manager: BaseManager;
  waitForInitialization?: boolean;
}

export interface ManagerInfo {
  state: AppState;
  manager: BaseManager;
}

export abstract class BaseManager {
  unload() {}
  abstract initializeAsync(
    logLevel: LogLevel,
    updateState: (state: AppState) => void
  ): Promise<AppState>;
  protected updateState: (state: AppState) => void = null!;
  protected readonly logger: Logger;

  constructor(
    name: string,
    version:
      | `v${number}.${number}.${number}`
      | `v${number}.${number}.${number}-${"beta" | "alpha"}`
  ) {
    this.logger = new Logger(`${name}(${version})`);
  }

  protected async tryAsync<T>(
    action: () => Promise<T>
  ): Promise<[Error | undefined, T | undefined]> {
    try {
      const result = await action();
      return [undefined, result as T | undefined];
    } catch (e: any) {
      this.logger.error(e);
      return [e, undefined];
    }
  }

  protected tryThis<T>(action: () => T): [Error | undefined, T | undefined] {
    try {
      const result = action();
      return [undefined, result as T | undefined];
    } catch (e: any) {
      return [e, undefined];
    }
  }

  protected async tryFetch<T>(
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<[Error | undefined, T | undefined, Response | undefined]> {
    const [error, response] = await this.tryAsync(
      async () => await fetch(input, init)
    );
    return [
      error,
      response && response.ok && (await response.json()),
      response,
    ];
  }
}

export class Logger {
  private readonly name: string;
  private logLevel: LogLevel = LogLevel.Info;
  constructor(name: string) {
    this.name = name;
  }

  _setLogLevel(minLogLevel: LogLevel) {
    this.logLevel = minLogLevel;
  }

  private formatMessage(message: string): string {
    const now = new Date();
    return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - ${
      this.name
    }: ${message}`;
  }

  debug(message: string, ...rest: any[]) {
    if (this.logLevel > LogLevel.Debug) return;

    message = "DEBUG - " + this.formatMessage(message);
    if (rest && rest.length > 0) console.debug(message, ...rest);
    else console.debug(message);
  }

  info(message: string, ...rest: any[]) {
    if (this.logLevel > LogLevel.Info) return;

    message = "INFO  - " + this.formatMessage(message);
    if (rest && rest.length > 0) console.info(message, ...rest);
    else console.info(message);
  }

  warn(message: string, ...rest: any[]) {
    if (this.logLevel > LogLevel.Warning) return;

    message = "WARN  - " + this.formatMessage(message);
    if (rest && rest.length > 0) console.warn(message, ...rest);
    else console.warn(message);
  }

  error(message: string, ...rest: any[]) {
    if (this.logLevel > LogLevel.Error) return;

    message = "ERROR - " + this.formatMessage(message);
    if (rest && rest.length > 0) console.error(message, ...rest);
    else console.error(message);
  }
}
