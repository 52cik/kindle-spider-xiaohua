'use strict'

const tinyDB = require('tinydb')
const Crawler = require('crawler')

const uri = 'http://m.69shu.com/txt/1464.htm'

const db = new tinyDB()
const db_key = 'xiaohuadetieshengaoshou'

let list = [] // 章节列表
let onDrain_cb // 结束回掉

const c = new Crawler({
  forceUTF8: true,
  onDrain: function () {
    c.pool.destroyAllNow()
    onDrain_cb && onDrain_cb(list)
  }
})

/**
 * 抓取列表
 *
 * @param  {Function} cb    回调函数
 * @param  {Numer}   limit 抓取条，默认5条
 */
function fatchList(cb, limit) {
  onDrain_cb = cb
  limit = limit || 5

  c.queue([{
    uri,
    callback: (error, result, $) => {
      let $list = $('.chapter_list01>ul>li>a')
      let last = db.get(db_key) // 最新章节

      $list.each((idx, el) => {
        let title = $(el).text()
        let href = $(el).attr('href')

        if (last === href) { // 处理老章节
          return false
        }

        fatchContent(title, href, cb)
      })

      db.set(db_key, $list.eq(0).attr('href')) // 保存最新章节
    }
  }])
}

/**
 * 抓取小说内容
 *
 * @param  {String}   title 小说章节标题
 * @param  {String}   uri   小说章节地址
 * @param  {Function} cb    回调函数
 */
function fatchContent(title, uri) {
  c.queue([{
    uri,
    callback: (error, result, $) => {
      let text = '<p>' + $('#chapcont').text().replace(/[\xa0]+/g, '</p><p>') + '</p>'
      list.push({title, text})
    }
  }])
}

// 导出接口
module.exports = fatchList
