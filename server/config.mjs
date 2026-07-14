const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function loadConfig(env = process.env) {
  const appName = env.APP_NAME || 'cat';
  const clientName = env.CLIENT_NAME || 'acme';
  const mongoCollection = env.MONGO_COLLECTION || clientName;

  for (const [name, value] of Object.entries({ appName, clientName })) {
    if (!slugPattern.test(value)) {
      throw new Error(`${name} debe ser un slug DNS: minúsculas, números y guiones`);
    }
  }

  if (!mongoCollection || mongoCollection.includes('$') || mongoCollection.includes('\0')) {
    throw new Error('MONGO_COLLECTION contiene caracteres no válidos');
  }

  return {
    appName,
    clientName,
    basePath: `/${clientName}`,
    port: Number(env.PORT || 3000),
    mongoUri: env.MONGO_URI || 'mongodb://localhost:27017/triviere',
    mongoCollection,
  };
}
