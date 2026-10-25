import type * as Sentry from '@sentry/node'
import type { Dictionary, ILoggerClient, LogLevel, Optional } from '@xeno-js/core'
import { Guards, LOG_LEVEL } from '@xeno-js/core'

/**
 * @description Concrete implementation of ILoggerClient that uses Sentry as the error tracking system. This class acts as an adapter between the ILoggerClient interface and the Sentry library, allowing the use of Sentry as a logging provider within the application's architecture without directly coupling the code to the specific tracking framework.

   * 
   * @author Xeno
   * @version 1.0.0
   * @since 2025-09-30
   * @link https://github.com/xeno-js/xeno-js 
   */
export class SentryLogger implements ILoggerClient {
  constructor(
    private readonly _client: typeof Sentry,
    public readonly _minLevel: LogLevel,
  ) {}

  public track<T>(
    level: LogLevel,
    message: string,
    context: Optional<T extends Dictionary<unknown> ? T : never> = undefined,
    error: Optional<unknown> = undefined,
  ): void {
    if (level < this._minLevel) return

    if (level === LOG_LEVEL.ERROR || level === LOG_LEVEL.WARN) {
      this._client.withScope((scope) => {
        if (Guards.isDefined(context)) scope.setExtras(context)

        if (Guards.isDefined(error)) {
          this._client.captureException(error)
        } else {
          this._client.captureMessage(message, 'warning')
        }
      })
    }
  }
}
