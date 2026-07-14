const clientName = process.env.CLIENT_NAME || 'acme';

module.exports = {
  [`/${clientName}/api`]: {
    target: 'http://127.0.0.1:3000',
    secure: false,
  },
};
