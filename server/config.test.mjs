import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from './config.mjs';

test('deriva la ruta y colección a partir del cliente', () => {
  const config = loadConfig({ APP_NAME: 'cat', CLIENT_NAME: 'cliente-uno' });
  assert.equal(config.basePath, '/cliente-uno');
  assert.equal(config.mongoCollection, 'cliente-uno');
});

test('permite configurar una colección explícita', () => {
  const config = loadConfig({
    APP_NAME: 'cat',
    CLIENT_NAME: 'cliente-uno',
    MONGO_COLLECTION: 'cliente_uno',
  });
  assert.equal(config.mongoCollection, 'cliente_uno');
});

test('rechaza nombres que no pueden usarse en host o ruta', () => {
  assert.throws(
    () => loadConfig({ APP_NAME: 'CAT', CLIENT_NAME: 'cliente' }),
    /slug DNS/,
  );
});
