/**
  运行方式：
  点开桌面 GitBash
  输入 node /e/BaiduYunDownload/baby/@@@/demo.js   回车           这句命令就是切换到脚本目录
  然后 node demo.js 回车             执行脚本
*/


// 配置对象
var options = {
  urlBase: 'http://www.mafengwo.cn',    // 网页主机
  listAjaxUrl: 'http://www.mafengwo.cn/gonglve/ajax.php?act=get_travellist',  //  Ajax 请求列表的 url
  listParams: {
    mddid: '10300',          // 目的地id
    pageid: 'mdd_index',      // 发出请求的页面
    sort: 1,               // 排序方式： 1 最热排序  2 最新排序
    cost: 0,              // 花费排序方式： 0 不限
    days: 0,              // 出行天数拍序： 0 不限
    month: 0,             // 出行时间拍序  0 不限
    tagid: 0,
  },
  delay: 1500,
  useTimeFilter: 'no',      // 是否使用时间过滤发帖时间，'no' 就是不过滤，'yes' 为过滤
  startTime: new Date(2016, 4, 1),     // 使用时间过滤情况下的开始时间， 三个参数分别是年，月，日， 注意 月份是 0-11的，所以5月的话参数为4。
  endTime: new Date(2017, 0, 1),       // 结束时间
  startPage: 1,           // 开始爬取的列表的页码，包含这一页，即最小为1，最大为300
  endPage: 3,            // 结束爬取的列表的页码，包含这一页，即最小为1，最大为300
  xlsxHeader: [['标题', '地址', '作者', '时间', '出发时间', '出行天数', '人物', '人均费用', '正文']],                 // excel 文件的表头
  allInOne: 0             // 游记的存放方式，目前该配置暂时没用，0表示每页列表的游记存放在一个excel文件中， 1表示所有的游记存放在1个excel文件中。
};

module.exports = options;
