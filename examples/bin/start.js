const Leafage = require('leafage');
const config = require('../leafage.config');

(async () => {
  const leafage = new Leafage(config);

  leafage.listen();
})();
