// Core module
export { PluginModule } from './plugin.module';

// Decorator
export { SourcePlugin, SOURCE_PLUGIN_METADATA } from './decorators/source-plugin.decorator';

// Registry
export { PluginRegistry } from './registry/plugin-registry.service';

// Discovery
export { PluginDiscoveryService } from './discovery/plugin-discovery.service';

// Interfaces
export { IPluginMetadata, PluginCategory } from './interfaces/plugin-metadata.interface';

// Configuration
export {
  DISABLED_SOURCES_ENV_VAR,
  parseDisabledSources,
  readDisabledSources,
} from './config/disabled-sources';

// Circuit breaker (Spec 005)
export { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
export { CircuitBreakerInterceptor } from './circuit-breaker/circuit-breaker.interceptor';
export { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';

// Persistence-store plugin (Spec 004)
export {
  StorePlugin,
  STORE_PLUGIN_METADATA_KEY,
} from './store/store-plugin.decorator';
export {
  StoreRegistry,
  StoreRegistryError,
  ERR_STORE_INVALID_ID,
  ERR_STORE_DUPLICATE_ID,
} from './store/store-registry.service';
export {
  StoreModule,
  StoreModuleConfigurationError,
  StoreModuleForActiveOptions,
  ERR_STORE_ACTIVE_ID_REQUIRED,
  ERR_STORE_BACKEND_NOT_DECORATED,
} from './store/store.module';
