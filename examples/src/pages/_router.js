const Router = require('leafage/Router');

const router = Router();

router.get('/', (req, res) => {
  res.render('index', { nihao: 123 });
});

module.exports = router;
