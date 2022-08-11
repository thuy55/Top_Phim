const MovieOption = require("../schema/MovieOptionSchema");
const Category = require("../schema/CategorySchema");
const findCategoryName = async (categorySlug) => {
  let cat =  await Category.findOne({ categorySlug:  formatCategory(categorySlug)  }).select([
    "category",
  ]);
  if(cat) {
    return cat;
  }else {
    return {category: categorySlug};
  }
};
const formatCategory = (categorySlug) => {
  if(categorySlug.includes('kinh-di')) {
    return 'phim-kinh-di'
  }
  if(categorySlug.includes('kinh-dien')){
    return 'phim-kinh-dien'
  }
  else {
    return categorySlug;
  }
}
module.exports = {
  findCategoryName,
};
