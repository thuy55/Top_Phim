const axios = require("axios");
const cheerio = require("cheerio");
const common = require("./common");
const MovieModel = require("./db/model/Movie");
const hostClone = require("./config/hostClone");
const config = require("./config");
const { removeVI } = require("jsrmvi");
const { httpGet } = require("./common");
const fs = require("fs");
//1-2: xuất ctrl+U
//(1)
const getListHomePage = async (url) => {
  console.log(`START GET LIST LINK HOME ${url}`);
  let buf = await common.httpGet(url);
  let contentHome = buf.toString("utf-8");
 //(2)
  const $ = cheerio.load(contentHome);
  let listMV = $(".uk-cover-container");

  for (let i = listMV.length - 1; i >= 0; i--) {
    let linkVM = $(listMV[i]).find("a").attr("href");
    console.log({ linkVM });
    //(3) 2-3: tách trang kiếm link các bộ phim
    let linkClones = await MovieModel.getListLinkByCloneFrom(
      hostClone.PHIM4400
    );
    let linkRebase = rebaseLinkClone(linkVM);
     //(4) 3-4-5: đổi tên base_link = phim4400
    if (!linkClones.includes(linkRebase)) {//(6) : truyền dữ liệu linkVM vào getDetailMV_V2
      await getDetailMV_V2(linkVM);

    }
    
  }
};
var countClone=60;
const rebaseLinkClone = (link) => {//(5)
  return link.replace(hostClone.BASE_LINK_PHIM4400, hostClone.PHIM4400);//(5)
};
//V2
const getDetailMV_V2 = async (urlDetail) => {
  console.log(`======START GET DETAIL MV LINK: ${urlDetail}`);
  //(7) 7-8: tách html
  let buf = await common.httpGet(urlDetail);
  let contentVMDetail = buf.toString("utf-8");
  const $ = cheerio.load(contentVMDetail);
  let title = $(".info-phim h1").text();
  //(8)
  let slug = removeVI(title);
  let linkSource = $(".fb-like").attr("data-href");
  let description = $(".content p").text().trim();
  let trial = $(".trailer-phim a").attr("href");
  let thumbLink = $('meta[property="og:image"]').attr("content");
  let infoMovie = {
    slug,
    title,
    description,
    trial,
    cloneLink: rebaseLinkClone(urlDetail),
    cloneFrom: hostClone.PHIM4400,
  };
 ;
   //Get mv option
  let trOptions = $(".uk-table.uk-table-striped").find("tr")[1];
  let options = $(trOptions).find("td");
  let times = $(options[0]).text().trim();
  let quanlity = $(options[1]).text().trim();
  let year = $(options[2]).text().trim();
  if(isNaN(parseInt(year))) {
    year = 2020
  };
  
  //Get category movie
  let category = $(".uk-breadcrumb").find("li");
  let categoryValue = $(category[1]).text().toLowerCase();
  let movieOption = {
    times,
    category: categoryValue,
    categorySlug: removeVI(categoryValue),
    year,
    quanlity,
    region: "Quốc gia khác",
    regionSlug: "quoc-gia-khac",
  };
  const resources = await getSourceMV_V2(linkSource, title);
  if (resources && resources.length > 0) {
    infoMovie.resources = resources;
    let movieThumb = await common.cloneImage(thumbLink);
    infoMovie.movieThumb = movieThumb;
    let movieId = await common.insertMovie(infoMovie);
    movieOption.movieId = movieId;
    common.insertMovieOption(movieOption);
    console.log({ countClone });
  }
};

const getSourceMV_V2 = async (url, title) => {
  console.log(`======START GET SOURCE MV LINK ${url}`);
  try {
    var buf = await common.httpGet(url);
    let contentPage = buf.toString("utf-8");
    const patternIframe1 = /id="ifame-1">.+?<\/iframe>/g;
    const patternIframe2 = /id="ifame-2">.+?<\/iframe>/g;
    const patternIframe3 = /id="ifame-3">.+?<\/iframe>/g;
    const patternIframe4 = /id="ifame-4">.+?<\/iframe>/g;
    let server1 = "";
    let server2 = "";
    let server3 = "";
    let server4 = "";

    try {
      server1 = contentPage.match(patternIframe1)[0];
    } catch (error) {
      console.log('Not found frame 1');
    }
    try {
      server2 = contentPage.match(patternIframe2)[0];
    } catch (error) {
      console.log('Not found frame 2');
    }
    try {
      server3 = contentPage.match(patternIframe3)[0];
    } catch (error) {
      console.log('Not found frame 3');
    }
    try {
      server4 = contentPage.match(patternIframe4)[0];
    } catch (error) {
      console.log('Not found frame 4');
    }
   
  
    let listServer = [server1, server2, server3, server4];
    let listResource = [];

    let fembedLink = listServer.find((s) => s.includes("fembed"));
    let srcFemberLink = ""
    if (fembedLink) {
      srcFemberLink  = await getSrcFromIframe(fembedLink);
      console.log(srcFemberLink);
    }
    if(srcFemberLink) {
      let doodLink = await uploadRemoteDoodServer(srcFemberLink, title);
      listResource.push(doodLink);
    }
    if(listResource !=null){
      console.log({ listResource });
    }
    return listResource;
  } catch (error) {
    console.log(error);
    return null;
 }
 }


const uploadRemoteDoodServer = async (linkSource, title) => {
  const requestlistVideos = await axios.get(config.DOOD_API_LIST_FILE);
  const listFiles = requestlistVideos.data.result.files;
  let isExisted = listFiles.find(f => encodeURIComponent(f.title) == encodeURIComponent(title));
  //Neu co file thi return
  if(isExisted) {
    console.log('File existed: ', isExisted);
    return config.DOOD_EMBED_API.replace("[FILECODE]", isExisted.file_code);
   }

  let apiUpload = config.DOOD_UPLOAD_API.replace(
    "[URL]",
    linkSource
  ).replace("[TITLE]", encodeURIComponent(title));
  let resUploadRemoteDood = await axios.get(apiUpload);
  let fileCode = resUploadRemoteDood.data.file_code;
  let doodLink = config.DOOD_EMBED_API.replace("[FILECODE]", fileCode);
  countClone--;
   return doodLink;
};


const getSrcFromIframe = async (strIframe) => {
  const patternSrc = /src=".+?"/g;
  let src = strIframe.match(patternSrc)[0].split('"');
  return src[1];
};
const getSourceFembed = async (link) => {
  //Get list resource
  let listPart = link.split("/v/");
  let urlGetSource = listPart[0] + "/api/source/" + listPart[1];
  console.log({ urlGetSource });
  let sourceVideos = await axios.post(urlGetSource);
  console.log("HEADER", sourceVideos.headers);
  let { data } = sourceVideos.data;
  return data;
};
module.exports = {
  getListHomePage,
  getSourceFembed,
   getDetailMV_V2
};
