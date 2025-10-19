import { join } from 'path';
import { ConfigBuilder, ConfigException } from '../src/config.builder.js';

describe('AppliedConfigBuilder', () => {
  let builder: ConfigBuilder<{ a: number; b: { c: string } }>;

  beforeEach(() => {
    builder = new ConfigBuilder<{ a: number; b: { c: string } }>();
  });

  describe('applyStaticConfig', () => {
    it('should merge the applied config', () => {
      const result = builder
        .applyStaticConfig({ b: { c: 'test' } })
        .buildConfig();
      expect(result).toEqual({
        a: undefined,
        b: { c: 'test' },
        require: expect.any(Function),
        get: expect.any(Function),
      });
    });
  });

  describe('applyDynamicConfig', () => {
    it('should merge the applied config', () => {
      const result = builder
        .applyDynamicConfig({ b: { c: 'test' } })
        .buildConfig();
      expect(result).toEqual({
        a: undefined,
        b: { c: 'test' },
        require: expect.any(Function),
        get: expect.any(Function),
      });
    });
  });

  describe('loadJsonFile', () => {
    it('should not throw if optional is true and file is not found', () => {
      expect(builder.loadJsonFile('./doesnt-exist.json', true)).toBe(builder);
    });

    it('should throw if optional is false and file is ot found', () => {
      expect(() =>
        builder.loadJsonFile('./doesnt-exist.json', false),
      ).toThrow();
    });

    it('should always throw if file format is invalid', () => {
      const file = join(__dirname, './etc/invalid.json');
      expect(() => builder.loadJsonFile(file, true)).toThrow();
      expect(() => builder.loadJsonFile(file, false)).toThrow();
    });

    it('should use normal json parsing if json5 does not exist', () => {
      jest.mock('json5', () => {
        throw new Error('Not Avaiable');
      });
      const file5 = join(__dirname, './etc/valid.json5');
      expect(() => builder.loadJsonFile(file5, true)).toThrow();
      expect(builder.buildConfig().a).toBe(undefined);

      const file = join(__dirname, './etc/valid.json');
      expect(builder.loadJsonFile(file)).toBe(builder);
      expect(builder.buildConfig().a).toBe(1);
    });

    it('should allow json5 if json5 exists', () => {
      jest.mock('json5', () => jest.requireActual('json5'));
      const file = join(__dirname, './etc/valid.json5');
      expect(builder.loadJsonFile(file)).toBe(builder);
      expect(builder.buildConfig().a).toBe(1);
    });

    it('should be able to parse normal json if json5 exists', () => {
      jest.mock('json5', () => {
        throw new Error('Not Avaiable');
      });
      const file = join(__dirname, './etc/valid.json');
      expect(builder.loadJsonFile(file)).toBe(builder);
      expect(builder.buildConfig().a).toBe(1);
    });
  });

  describe('loadEnv', () => {
    it('should load environment variables starting with the prefix into the config and ignore anything else', () => {
      const env = { 'MY_APP-a': '1', 'MY_APP-b-c': '2', Randomstuff: 'dwadwa' };
      const result = builder.loadEnv(env, 'MY_APP', '-').buildConfig();
      expect(result).toEqual({
        a: 1,
        b: { c: 2 },
        require: expect.any(Function),
        get: expect.any(Function),
      });
    });

    it('should load environment variables as string when parse json is disabled', () => {
      const env = {
        'MY_APP-a': '1',
        'MY_APP-b-c': '{{test',
        Randomstuff: 'dwadwa',
      };
      const result = builder.loadEnv(env, 'MY_APP', '-', false).buildConfig();
      expect(result).toEqual({
        a: '1',
        b: { c: '{{test' },
        require: expect.any(Function),
        get: expect.any(Function),
      });
    });
  });

  describe('require', () => {
    it('should throw ConfigException when a required field is undefined', () => {
      expect(() => builder.buildConfig().require({ a: true })).toThrow(
        new ConfigException(`The config key "a" is required!`),
      );
    });

    it('should throw ConfigException when a field with sub fiels is not an object', () => {
      expect(() =>
        builder
          .applyStaticConfig({ b: 1 } as any)
          .buildConfig()
          .require({ b: { c: true } }),
      ).toThrow(
        new ConfigException(`The config key "b" is expected to have sub keys!`),
      );
    });
  });

  describe('get', () => {
    it('should return the config value at the specified path', () => {
      const result = builder
        .applyDynamicConfig({ a: 1, b: { c: 'test' } })
        .get('a');
      expect(result).toEqual(1);
    });

    it('should return the config value at the specified nested path', () => {
      const result = builder
        .applyDynamicConfig({ a: 1, b: { c: 'test' } })
        .get('b.c');
      expect(result).toEqual('test');
    });

    it('should return undefined if the config value at the specified path is not defined', () => {
      const result = builder
        .applyDynamicConfig({ a: 1, b: { c: 'test' } })
        .get<string>('b.d', true);
      expect(result).toBeUndefined();
    });
  });
});
