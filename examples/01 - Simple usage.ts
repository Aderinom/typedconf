import { env } from 'process';
import { ConfigBuilder } from '../src/config.builder.js';

interface ConfigSchema {
  database: {
    host: string;
    port: number;
    schemas: string[];
    enabled: boolean;
  };
  api: {
    host: string;
    port: number;
  };
  freeform: {
    [key: string]: number;
  };
}

export const cfg = new ConfigBuilder<ConfigSchema>()
  // Apply a default config
  .applyStaticConfig({
    database: {
      host: 'localhost',
      port: 5432,
      schemas: ['public'],
      enabled: true,
    },
    freeform: {
      someKey: 1,
    },
  })
  // Load environment variables, Loads all variables prefixed with "MY_APP_" using "_" as a delimiter
  // E.g "MY_APP_DATABASE_HOST" will be loaded to cfg.database.host
  // Every value will be parsed with JSON.parse()
  .loadEnv(env, 'MY_APP_', '_')
  // Apply config from an outside source
  .applyDynamicConfig(loadConfig())
  // [Only where "fs" is available] Loads a json file from disk - will use "json5" if available. File can be optional or required.
  .loadJsonFile("./config.json")
  .buildConfig();

// Now our typechecker knows all fields which are defined or might be undefied.
cfg.database.host; // defined
cfg.api?.port; // possibly undefined
cfg.freeform.someKey; // defined
cfg.freeform['any']; // number | undefined


// We can use the require method to check if a field is defined and throw an error if not.
const checkedcfg = cfg.require({
  api: {
    port: true,
    host: true,
  },
});

checkedcfg.api.port; // now defined

// Even dynamic config access is typechecked!
cfg.get('database.enabled'); // Defined Boolean
cfg.get('freeform.someKeyAsPerInterface'); // number|undefined
//cfg.get('database.undefinedKey'); // Type Error

cfg.get<boolean>('database.undefinedKey', true); // boolean|undefined - Allows accessing paths dynamically




// Mock function - could load config from a file or server, etc.
function loadConfig() {
  return {
    api:{
      host:"127.0.0.1",
      port:8080
    }
  }
}

