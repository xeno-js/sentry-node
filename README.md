<div align="center">
  <img src="logo/logo.png" alt="Xeno.JS Logo" width="140" />

  <h1>Xeno.JS Sentry/Node</h1>
  <p><strong>A Typescript application framework architecture for Node.js, designed for lower technical debt, and faster infrastructure migrations.</strong></p>
  <p>Build long-lived applications with explicit dependency injection, DDD, CQRS, and transport-independent business logic.</p>

  <p>
    <a href="https://www.npmjs.com/package/@xeno-js/sentry-node"><img src="https://img.shields.io/npm/v/@xeno-js/sentry-node?style=flat-square" alt="NPM Version" /></a>
    <a href="https://github.com/xeno-js/sentry-node"><img src="https://img.shields.io/badge/Powered%20by-Xeno-blueviolet?style=flat-square" alt="Powered by Xeno" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT" /></a>
    <a href="https://buymeacoffee.com/xenojs">
      <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFdd00?style=flat-square&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
    </a>
  </p>
</div>

---

---

`@xeno-js/sentry-node` provides error tracking and observability integration for the Xeno.JS ecosystem using Sentry. It acts as a logger plugin adapter implementing core logging contracts to capture runtime exceptions and warnings.

## Installation

```bash
npm install @xeno-js/sentry-node @sentry/node

```

The package requires `@xeno-js/core` as a peer dependency.

---

## 1. Plugin Configuration and Sentry Initialization

**Problem.** Enterprise applications require centralized error tracking and performance monitoring to capture unhandled exceptions, trace transactions, and filter out unnecessary noise in production environments.

**Principle.** Error monitoring integration must be declared cleanly through configuration services and application builder plugins without hardcoding provider SDKs into business logic.

**Mechanism.** The `withSentryNodeLogger` function exposes a logger plugin that reads default configuration variables (`SENTRY_DSN`, `SENTRY_RELEASE`, `SENTRY_ENVIRONMENT`), instantiates `SentryLoggerFactory`, and registers a custom logger into the framework.

**Implementation:**

```ts
import { XenoAppBuilder } from '@xeno-js/core';
import { withSentryNodeLogger } from '@xeno-js/sentry-node';

const app = await new XenoAppBuilder()
  .addLogger(
    withSentryNodeLogger((options, config) => {
      options.isEnabled = true;
      options.dsn = config.get('SENTRY_DSN');
      options.environment = config.getEnvironment();
    })
  )
  .build();

```

**Behavior:** During bootstrap, `SentryLoggerFactory` initializes the underlying Sentry Node SDK with configured environment parameters, HTTP integrations, dynamic sample rates (defaulting to `0.1` in production and `1.0` in other environments), and a built-in `beforeSend` filter that automatically drops `ZodError` or validation exception payloads containing `issues`.

**Boundary:** This package exclusively manages Sentry initialization, error formatting, and transport reporting, delegating core application routing and business execution to framework modules.

---

## 2. Error Tracking and Scope Management (`SentryLogger`)

**Problem.** Standard logging implementations often fail to propagate rich contextual data (such as request parameters or user metadata) alongside captured exceptions to external monitoring platforms.

**Principle.** Log messages meeting or exceeding threshold severity levels must be safely forwarded to the tracking provider bundled with relevant context extras.

**Mechanism:** `SentryLogger` implements the `ILoggerClient` contract, evaluating log levels against a minimum threshold (`minLevel`) and invoking Sentry's `withScope` utility to attach context extras before capturing exceptions or warning messages.

**Implementation:**

The logger is resolved automatically by the framework or injected via container tokens:

```ts
import { TOKENS, LOG_LEVEL } from '@xeno-js/core';

// Inside a service or handler error catch block
const logger = container.resolve(TOKENS.LOGGER);
logger.track(LOG_LEVEL.ERROR, 'Database operation failed', { userId: '123' }, error);

```

**Behavior:** When `track` is called with `ERROR` or `WARN` severity levels (and meeting `minLevel`), `SentryLogger` opens a Sentry scope, applies extra context metadata, and captures either the exception via `captureException` or a warning message via `captureMessage`.

**Boundary:** `SentryLogger` acts purely as an observability adapter for structured exception reporting, relying on Sentry's SDK for network transport.

---

## License

Released under the MIT [License](LICENSE).
