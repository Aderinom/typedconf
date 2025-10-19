import { ConfigBuilder } from '../src/index.js';

describe('env', () => {
  test('should load environment variables with prefix and delimiter', () => {
    const env = {
      MY_APP_database_host: '"db.example.com"',
      MY_APP_database_port: '3306',
      MY_APP_apiHost: '"api.example.com"',
    };

    const cfg = new ConfigBuilder<any>()
      .loadEnv(env, 'MY_APP', '_')
      .buildConfig();

    expect(cfg.database.host).toBe('db.example.com');
    expect(cfg.database.port).toBe(3306);
    expect(cfg.apiHost).toBe('api.example.com');
  });

  test('should correctly apply parsing function', () => {
    const env = {
      MY_APP_feature_enabled: 'true',
      MY_APP_max_connections: '100',
    };

    const parser = (key: string, value: string) => {
      console.warn(key, value);
      if (key === 'feature_enabled') return value === 'true';
      if (key === 'max_connections') return parseInt(value, 10);
      return value;
    };

    const cfg = new ConfigBuilder<any>()
      .loadEnv(env, 'MY_APP', '_', { parser })
      .buildConfig();

    expect(cfg.feature.enabled).toBe(true);
    expect(cfg.max.connections).toBe(100);
  });
});
