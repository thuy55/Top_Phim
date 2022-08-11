const common = require('./src/common');
common.initDb();
const clonePhim4400 = require("./src/clonePhim4400");
const phim4400 = async () => {
  await clonePhim4400.getListHomePage("https://xemphimnao.com");
  console.log("========== CLONE DONE ==========");
};

  phim4400();
module.exports = {
  phim4400
}