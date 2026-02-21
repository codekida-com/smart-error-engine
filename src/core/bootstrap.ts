import { attachListeners } from '../platform/index';
import { bus } from './bus';
import { LogThrottler } from './throttle';
import { HeuristicMapper } from './heuristics';
import { report } from '../reporters/pretty';
import { getEnvInfo } from '../platform/env';
import { initAsyncTracker } from '../plugins/async-tracker';
import { initBrowserTracker } from '../plugins/browser-tracker';
import { config, errorEngineOptions } from './config';

const throttler = new LogThrottler();
let isHandlersAttached = false;
let reportFunc: any;

export function init(options?: errorEngineOptions) {
  // 1. Update configuration (can be called multiple times)
  if (options) {
      config.update(options);
  }

  // 2. Attach handlers only once
  // Track async hook configuration
  const env = getEnvInfo();
  if (options?.asyncHooks && env.runtime === 'Node') {
      initAsyncTracker(true);
  }

  // Track browser tracing
  if (options?.browserTracker && env.runtime === 'Browser') {
      initBrowserTracker(true);
  }

  // Fetch remote config if requested
  if (options?.remoteConfigUrl) {
      // Async fire and forget
      config.loadRemoteConfig();
  }

  if (isHandlersAttached) {
      if (config.get().debug) console.log('[smart-error-engine] Init called but handlers already attached.');
      return;
  }
  isHandlersAttached = true;
  if (config.get().debug) console.log('[smart-error-engine] Initializing and attaching listeners...');

  // 3. Setup Error Bus
  bus.on(async (error, type) => {
    // Chaos Management: Throttle functionality
    if (config.get().throttle?.enabled && !throttler.shouldLog()) return;

    // Lazy load reporter
    if (!reportFunc) {
      try {
        const mod = require('../reporters/pretty');
        reportFunc = mod.report;
      } catch (e) {
        console.error('[smart-error-engine] Failed to load reporter:', e);
        console.error(error); // Fallback
        return;
      }
    }

    // Safe Reporter Execution
    if (config.get().safeReporter) {
        try {
            await reportFunc(error, type);
        } catch (reporterError) {
             console.error('[smart-error-engine] Reporter crashed:', reporterError);
             console.error(error); // Fallback to raw error
        }
    } else {
        await reportFunc(error, type);
    }

    // Exit Handling
    // In serverless or prod, we might not want to delay exit.
    // In dev, we might want to ensure logs flush.
    const isFatal = type === 'error' || type === 'unhandledRejection';
    
    if (typeof process !== 'undefined' && isFatal) {
        const conf = config.get();
        // Determine if we should block/delay exit
        const shouldDelay = conf.exit?.blockInDev && !config.isProduction && !config.isServerless;
        
        if (shouldDelay) {
            setTimeout(() => process.exit(1), conf.exit?.delayMs || 500);
        } else {
            process.exit(1);
        }
    }
  });

  // 4. Attach Platform Listeners
  attachListeners();
}

// Legacy alias for internal backward compatibility if needed, 
// but we should update usages to call init
export const bootstrap = () => init();
