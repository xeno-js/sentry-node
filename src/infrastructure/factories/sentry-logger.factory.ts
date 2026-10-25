import * as Sentry from '@sentry/node'
import type { IFactory, ILoggerClient, LogLevel } from '@xeno-js/core'
import { Guards, LOG_LEVEL } from '@xeno-js/core'

import { SentryLogger } from '../service/sentry.logger'

export interface SentryFactoryInput {
    /**
     * @description The DSN (Data Source Name) for the Sentry project. This is a unique identifier provided by Sentry to connect your application to the Sentry
     */
    dsn: string
    /**
    * @description The environment in which the application is running. This information is used by Sentry to categorize and filter events based on the environment.
    */
    environment: string
    /**
     * @description The release version of the application. This information is used by Sentry to track the version of the application that generated the events.
    */
    release: string
    /**
     * @description The log level at which the logger should operate. This determines the severity of the log messages that will be captured and sent to Sentry. The log level can be set to one of the predefined levels such as 'debug', 'info', 'warning', 'error'.
    */
    level?: LogLevel
    /**
    * @description Additional options for configuring Sentry. These options can be used to customize the behavior of Sentry, such as enabling or disabling specific features or configuring advanced settings.
    */
    sentryOptions?: Sentry.NodeOptions
}

/**
 * @description Factory class responsible for creating instances of SentryLogger based on the provided configuration. It implements the IFactory interface, allowing for easy integration with dependency injection systems. The factory encapsulates the creation logic for the SentryLogger, including the initialization of the underlying Sentry instance with the specified configuration options such as DSN and environment. This design promotes separation of concerns and allows for flexibility in managing SentryLogger instances across the application.

   * 
   * @author Xeno
   * @version 1.0.0
   * @since 2025-09-30
   * @link https://github.com/xeno-js/xeno-js 
   */
export class SentryLoggerFactory implements IFactory<
    SentryFactoryInput,
    ILoggerClient
> {
    public create(config: SentryFactoryInput): ILoggerClient {
        const level = config.level ?? LOG_LEVEL.WARN
        const sentryConfig = config.sentryOptions
        
        const env = !Guards.isNullOrEmpty(config.environment) ? config.environment : 'development'
        const dsn = config.dsn

        if (Guards.isNullOrEmpty(dsn))
            throw new Error('Sentry DSN is required when Sentry logging is enabled.')

        Sentry.init({
            dsn,
            environment: env,
            release: config.release,
            tracesSampleRate: sentryConfig?.tracesSampleRate ?? (env === 'production' ? 0.1 : 1.0),
            integrations: [Sentry.httpIntegration()],
            ...sentryConfig,
            beforeSend: (event, hint) => {
                if (Guards.isDefined(sentryConfig?.beforeSend)) {
                    const customResult = sentryConfig.beforeSend(event, hint)
                    if (Guards.isDefined(customResult)) return null
                }

                const error = hint?.originalException

                if (error instanceof Error && (error.name === 'ZodError' || 'issues' in error)) {
                    return null
                }

                return event
            },
        })

        return new SentryLogger(Sentry, level)
    }
}
