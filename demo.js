let agent = require('superagent');
let fs = require('fs');
let cheerio = require('cheerio');
var xlsx = require('node-xlsx').default;
var options = require('./config');


const urlBase = options.urlBase;
let listAjaxUrl = options.listAjaxUrl;
let pageStart = options.startPage;
let pageEnd = options.endPage;
let listParams = options.listParams;
let useTimeFilter = options.useTimeFilter;
let startTime = options.startTime;
let endTime = options.endTime;
let delay = options.delay;


let timer = null;
let parallel = 0;
let urlArr = new Array();         // 保存所有游记的相对url
let authorCom = false;            // 作者信息是否全部请求完成
let pageCom = false;              // 游记内容是否全部请求完成

let contentArray = options.xlsxHeader;
let recordLen = 0;

// 获取所有游记的 url 地址，并在获取完后调用 getPageCon 获取游记内容 tn-item-sales
function getNewPageUrl(index) {
  agent.post('http://www.mafengwo.cn/gonglve/ajax.php?act=get_travellist')
    // .set('X-Requested-With', 'XMLHttpRequest')
    .type('form')
    // .send('mddid=10300&pageid=mdd_index&sort=1&cost=0&days=0&month=0&tagid=0&page=2')
    .send(listParams)
    .send({page: index})
    .end(function(err, res) {
      if(err) {
        console.log(err);
      }
      let $ = cheerio.load(res.body.list);
      $('.tn-list .tn-item').each(function(index, ele) {
        let $ele = $(ele);
        //  排除攻略内容
        if(!$ele.hasClass('tn-item-sales')) {
          urlArr.push($ele.find('.tn-image a').attr('href'));
        }
      });

      if(index == pageEnd) {
        recordLen = urlArr.length;
        console.log(`共获取了${recordLen}篇游记的地址`);
        console.log('所有游记地址获取完成，开始获取游记内容');
        getPageCon(0);
        return ;
      }
      index++;
      getNewPageUrl(index);
    });
}

getNewPageUrl(pageStart);


// 获取游记内容并写入文件
function getPageCon(index) {
  var url = urlBase + urlArr[index];
  let contentArr = [];
  let iid = urlArr[index].substring(3,10);


  getInfo(iid, url, contentArr, index);

  contentArray.push(contentArr);
  index++;
  if(index == recordLen) {
    return ;
  }

  if(parallel > 4) {
    timer = setInterval(checkPara, delay, index);
  } else {
    getPageCon(index);
  }
}

function checkPara(index) {
  if(parallel === 0) {
    clearInterval(timer);
    getPageCon(index);
  }
}

function getInfo(iid, url, arr, index) {
  parallel += 2;
  getPageInfo(url, arr, index);
  getAuthorInfo(iid, arr, index);
}


// 获取作者信息和时间
function getAuthorInfo(id, arr, index) {
  agent.get('http://pagelet.mafengwo.cn/note/pagelet/headOperateApi')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36')
      .query({params: `{"iid":${id}}`})
  .end(function(err, res) {
    if(err) {
      console.log(err);
    }

    // params=%7B%22iid%22%3A%226884204%22%7D
    // http://www.mafengwo.cn/note/__pagelet__/pagelet/headOperateApi?

    let $ = cheerio.load(res.body.data.html);
    arr[2] = $('.per_name').text().replace(/\s/, ' ');
    arr[3] = $('.vc_time .time').text().trim();

    // 完成请求并行数减一
    parallel--;

    // 最后的请求标志置位
    if(index == recordLen - 1) {
      authorCom = true;
    }

    if(authorCom && pageCom) {
      setTimeout(write, 5000);
    }
  });
}


// 获取游记内容
function getPageInfo(url, arr, index) {
  agent.get(url)
  .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36')
  .end(function(err, res) {
    if(err) {
      console.log(err);
    }
    let $ = cheerio.load(res.text);
    

    // 标题，url,作者，时间，出发时间，出行天数，人物，人均费用，正文，

    try {
      if(contentArray[0].length == 9) {
        arr[1] = url;
      }
  
      if($('.va_con').length ==0 && $('.post_wrap').length > 0) {
        arr[0] = $('.post_title').text().trim();
        arr[4] = $('.travel_directory .time').text().slice(-10);
        arr[5] = $('.travel_directory .day').text().trim().slice(5);
        arr[6] = $('.travel_directory .people').text().trim().slice(3);
        arr[7] = $('.travel_directory .cost').text().trim().slice(5, -3);
        arr[8] = $('.summary').nextAll().text().replace(/\s+/g, ' ');
      } else {
        arr[0] = $('.headtext').text().trim();
        arr[4] = $('.tarvel_dir_list .time').text().slice(-10);
        arr[5] = $('.tarvel_dir_list .day').text().trim().slice(5);
        arr[6] = $('.tarvel_dir_list .people').text().trim().slice(3);
        arr[7] = $('.tarvel_dir_list .cost').text().trim().slice(5, -3);
        arr[8] = $('.va_con').text().replace(/\s+/g, ' ');
      }
    } catch(e) {
      console.log(e);
    }

    // 完成请求并行数减一
    parallel--;

    console.log('第' + (index + 1) + '篇完成');

    // 最后的请求标志置位
    if(index == recordLen - 1) {
      pageCom = true;
    }

    if(authorCom && pageCom) {
      setTimeout(write, 5000);
    }
  });
}




function write() {
  let filename = 'demo.' + new Date().getTime().toString().slice(-5) + '.xlsx';

  console.log('所有游记获取完成，等待写入文件，文件名为' + filename);

  if(useTimeFilter == 'yes') {
    timeFilter();
    console.log(`过滤了 ${recordLen - contentArray.length + 1} 篇游记`);
  }


  let buffer = xlsx.build([{name: "mySheetName", data: contentArray}]);

  fs.writeFile(filename, buffer, function(err) {
    if(err) {
      console.log(err);
      console.log('文件写入出错');
    }
    console.log('文件写入完成');
  })
}

function timeFilter() {
  let start = startTime;
  let end = endTime;
  contentArray = contentArray.filter(function(value, index) {
    let date = new Date(value[3]);
    if(date > start && date < end || index == 0) {
      return true;
    }
  });
}
