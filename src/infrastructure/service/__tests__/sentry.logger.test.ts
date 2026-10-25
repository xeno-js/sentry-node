import type * as Sentry from '@sentry/node'
import { LOG_LEVEL } from '@xeno-js/shared'
import { describe, expect, it, vi } from 'vitest'

import { SentryLogger } from '../sentry.logger'


interface FakeScope {
  setExtras: (...args: unknown[]) => void
}

function makeSentry() {
  const setExtras = vi.fn()
  const scope: FakeScope = { setExtras }
  const withScope = vi.fn((cb: (s: FakeScope) => void) => cb(scope))
  const captureException = vi.fn()
  const captureMessage = vi.fn()
  const client = { withScope, captureException, captureMessage } as unknown as typeof Sentry
  return { client, scope, setExtras, withScope, captureException, captureMessage }
}

describe('SentryLogger', () => {
  it('does not call withScope when level is below minLevel', () => {
    const { client, withScope } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.ERROR)

    logger.track(LOG_LEVEL.WARN, 'below min')

    expect(withScope).not.toHaveBeenCalled()
  })

  it('does nothing for non-error/warn level even when at or above minLevel', () => {
    const { client, withScope } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)

    logger.track(LOG_LEVEL.INFO, 'info message')

    expect(withScope).not.toHaveBeenCalled()
  })

  it('calls captureMessage on WARN level without error', () => {
    const { client, withScope, captureMessage, captureException } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)

    logger.track(LOG_LEVEL.WARN, 'warn msg')

    expect(withScope).toHaveBeenCalledOnce()
    expect(captureMessage).toHaveBeenCalledWith('warn msg', 'warning')
    expect(captureException).not.toHaveBeenCalled()
  })

  it('calls captureException on WARN level with error', () => {
    const { client, captureException, captureMessage } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)
    const err = new Error('oops')

    logger.track(LOG_LEVEL.WARN, 'warn msg', undefined, err)

    expect(captureException).toHaveBeenCalledWith(err)
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('calls captureMessage on ERROR level without error', () => {
    const { client, captureMessage, captureException } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)

    logger.track(LOG_LEVEL.ERROR, 'error msg')

    expect(captureMessage).toHaveBeenCalledWith('error msg', 'warning')
    expect(captureException).not.toHaveBeenCalled()
  })

  it('calls captureException on ERROR level with error', () => {
    const { client, captureException, captureMessage } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)
    const err = new Error('fatal')

    logger.track(LOG_LEVEL.ERROR, 'error msg', undefined, err)

    expect(captureException).toHaveBeenCalledWith(err)
    expect(captureMessage).not.toHaveBeenCalled()
  })

  it('sets extras on scope when context is defined', () => {
    const { client, setExtras } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)
    const ctx = { requestId: 'abc' }

    logger.track(LOG_LEVEL.ERROR, 'with ctx', ctx)

    expect(setExtras).toHaveBeenCalledWith(ctx)
  })

  it('does not set extras on scope when context is undefined', () => {
    const { client, setExtras } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.DEBUG)

    logger.track(LOG_LEVEL.ERROR, 'no ctx', undefined)

    expect(setExtras).not.toHaveBeenCalled()
  })

  it('exposes _minLevel publicly', () => {
    const { client } = makeSentry()
    const logger = new SentryLogger(client, LOG_LEVEL.WARN)

    expect(logger._minLevel).toBe(LOG_LEVEL.WARN)
  })
})
