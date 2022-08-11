const hostClone = require("./config/hostClone");
const axios = require("axios");
const { removeVI } = require("jsrmvi");
const MovieModel = require("./db/schema/MovieSchema");
const MovieOptionModel = require("./db/schema/MovieOptionSchema");
const RegionModel = require("./db/schema/RegionSchema");
const CategoryModel = require("./db/schema/CategorySchema");
const initDb = () => {
  const mongoose = require("mongoose");
  //CONNECT DB
  mongoose
    .connect("mongodb+srv://thienbui91:thienbui91@cluster0.7yg5e.mongodb.net/<dbname>?retryWrites=true&w=majority", {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log("CONNECT DB SUCCESS....");
    })
    .catch((err) => {
      console.log("ERROR: ", err);
    });
};


const httpGet = async (url) => {
  return new Promise((resolve, reject) => {
    const http = require("http"),
      https = require("https");

    let client = http;

    if (url.toString().indexOf("https") === 0) {
      client = https;
    }

    client
      .get(url, (resp) => {
        let chunks = [];

        // A chunk of data has been recieved.
        resp.on("data", (chunk) => {
          chunks.push(chunk);
        });

        // The whole response has been received. Print out the result.
        resp.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

var path = require("path");
const fs = require("fs");
// Clone thumbnail movie
var imgbbUploader = require("imgbb-uploader");
const fetch = require("node-fetch");
const cloneImage = async (urlImage) => {
  const API_IMG_BB = "277bf5c2c5bdaa3fed67ab83c8a78af2";
  console.log({ urlImage });
  if (!urlImage) {
    return "";
  }
  urlImage = urlImage.replace("\n", "");
  let splitNameImg = null;
  if (urlImage.includes("?")) {
    splitNameImg = urlImage.split("?")[0].split("/");
  } else {
    splitNameImg = urlImage.split("/");
  }
  let imgName = splitNameImg[splitNameImg.length - 1];
  let ext = imgName.split(".");
  imgName = removeVI(ext[0]);
  ext = ext[ext.length - 1];
  imgName = imgName + "." + ext;
  let localImage = `/images/${imgName}`;
  const imgTmp = path.join(__dirname, localImage);
  try {
    await downloadImage(encodeURI(urlImage), imgTmp);
  } catch (error) {
    console.error(error.message);
    return {
      full: "/img/placeholder-medium.png",
      thumb: "/img/placeholder.png",
      medium: "/img/placeholder-medium.png",
    };
  }

  try {
    let imgUpload = await imgbbUploader(API_IMG_BB, imgTmp);
    fs.unlinkSync(imgTmp);
    const { image, thumb, medium } = imgUpload;
    return {
      full: image.url,
      thumb: thumb.url,
      medium: medium.url,
    };
  } catch (error) {
    console.log("Error UPLOAD: ", error.message);
    return {
      full: "/img/placeholder-medium.png",
      thumb: "/img/placeholder.png",
      medium: "/img/placeholder-medium.png",
    };
  }
};
const downloadImage = async (url, fileName) => {
  console.log(url);
  const writer = fs.createWriteStream(fileName);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 20 * 1000,
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

const insertMovie = async (infoMovie) => {
  infoMovie.createdAt = new Date().toISOString();
  let newMovie = new MovieModel(infoMovie);
  let res = await newMovie.save();
  console.log("INSERT MV SUCCESS: ", res._id);
  return res._id;
};
const insertMovieOption = async (movieOption) => {
  movieOption.createdAt = new Date().toISOString();
  movieOption.updatedAt = new Date().toISOString();
  let options = new MovieOptionModel(movieOption);
  let res = await options.save();
  console.log("INSERT SUCCESS MOVIE OPTION: ", res._id);
};
const dowload= async (linktilte) =>{
  console.log("hurhfuerhfhur",linktilte);
}
const initRegion = async () => {
  let listRegion = [
    "Trung Quốc",
    "Mỹ",
    "Hàn Quốc",
    "Nhật Bản",
    "Hồng Kông",
    "Ấn Độ",
    "Thái Lan",
    "Pháp",
    "Đài Loan",
    "Úc",
    "Anh",
    "Canada",
    "Poland",
    "Quốc gia khác",
  ];
  let convertRegions = [];
  listRegion.map((r) => {
    let regionSlug = removeVI(r.toLowerCase());
    convertRegions.push({ region: r, regionSlug });
  });
  
  //Lay danh sach quoc gia
  let exitsRegion = await RegionModel.find();
  //Loc danh sach quoc gia can insert
  let listInsert = [];
  convertRegions.map((cr) => {
    let isExited = exitsRegion.some((er) => er.regionSlug == cr.regionSlug);
    if (!isExited) {
      listInsert.push(cr);
    }
  });
  await RegionModel.insertMany(listInsert);
  
};

const initCategory = async () => {
  let listCategory = [
    "Phim hành động",
    "Phim viễn tưởng",
    "Phim chiến tranh",
    "Phim hình sự",
    "Phim phiêu lưu",
    "Phim hài hước",
    "Phim võ thuật",
    "Phim kinh dị",
    "Phim hồi hộp-Gây cấn",
    "Phim Bí ẩn-Siêu nhiên",
    "Phim cổ trang",
    "Phim thần thoại",
    "Phim tâm lý",
    "Phim tài liệu",
    "Phim tình cảm-Lãng mạn",
    "Phim chính kịch - Drama",
    "Phim Thể thao-Âm nhạc",
    "Phim gia đình",
    "Phim hoạt hình",
    "Phim chiếu rạp",
    "Phim lẻ"
  ];
  let convertCat = [];
  listCategory.map((r) => {
    let categorySlug = removeVI(r.toLowerCase());
    convertCat.push({ category: r, categorySlug });
  });
  //Lay danh sach
  let exitsCategory = await CategoryModel.find();
  //Loc danh sach
  let listInsert = [];
  convertCat.map((cr) => {
    let isExited = exitsCategory.some(
      (er) => er.categorySlug == cr.categorySlug
    );
    if (!isExited) {
      listInsert.push(cr);
    }
  });
  await CategoryModel.insertMany(listInsert);
};

module.exports = {
  httpGet,
  cloneImage,
  insertMovie,
  insertMovieOption,
  initRegion,
  initCategory,
  initDb,
  dowload
};
