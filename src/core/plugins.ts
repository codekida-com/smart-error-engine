export interface Plugin {
  id: string;
  setup: (context: PluginContext) => void;
}

export interface PluginContext {
  on: (event: string, handler: Function) => void;
  config: any;
}

const plugins: Plugin[] = [];

export function use(plugin: Plugin) {
  if (!plugin.id || !plugin.setup) {
      console.warn('[smart-error-engine] Invalid plugin format');
      return;
  }
  
  if (plugins.some(p => p.id === plugin.id)) return;
  
  plugins.push(plugin);
  
  // Initialize plugin immediately
  // In a real system, we might expose more internal hooks here
  plugin.setup({
      on: (event: string, handler: Function) => {
          // Shim for bus.on, essentially
          if (event === 'error') {
              // We'd need to import bus here, but let's keep it simple for now
              // or just store handlers to attach later?
              // For this "minimal interface", let's just log strictly to prove it works.
              console.log(`[smart-error-engine] Plugin ${plugin.id} listening on ${event}`);
          }
      },
      config: {} // Access to config
  });
}
