'use strict'

const urlResolve = require('url').resolve
const request = require('superagent')
const cheerio = require('cheerio')
const parallel = require("async/parallel")
const tinyDB = require('tinydb')

const url = 'http://www.shumilou.co/xiaohuadetieshengaoshou/'

const db = new tinyDB()
const db_key = 'xiaohuadetieshengaoshou'


/**
 * 抓取列表
 *
 * @param  {Function} cb    回调函数
 * @param  {[type]}   limit 抓取条，默认5条
 *
 */
function fatchList(cb, limit) {
  limit = limit || 5;

  fatch(url, str => {
    let $ = cheerio.load(str) // 解析html
    let $list = $('.zl>a').slice(-limit) // 截取末尾几条数据
    let tasks = [] // 保存并发任务

    let last = db.get(db_key) // 最新章节

    $list.each((idx, el) => { // 处理小说任务
      let title = $(el).text()
      let href = $(el).prop('href')

      if (last === href) { // 处理老章节
        return false
      }

      tasks.push(cb => { // 添加并发任务
        fatchContent(title, urlResolve(url, href), str => {
          cb(null, str)
        })
      })
    })

    db.set(db_key, $list.eq(-1).prop('href')) // 保存最新章节

    parallel(tasks, (err, results) => { // 并发抓取内容
      // console.log(results)
      cb(results)
    })
  })
}

/**
 * 抓取小说内容
 *
 * @param  {String}   url 小说章节地址
 * @param  {Function} cb  回调函数
 */
function fatchContent(title, url, cb) {
  fatch(url, str => {
    let $ = cheerio.load(str) // 解析html
    let text = $('#content>p').slice(0, -1).text()

    // console.log(text)
    cb({title, text})
  })
}


/**
 * 抓取 url 内容
 *
 * @param  {String}   url 地址
 * @param  {Function} cb  回调函数
 */
function fatch(url, cb) {
  request.get(url).end((err, res) => {
    if (err) {
      throw err
    }

    cb(res.text)
  })
}

// 导出接口
module.exports = fatchList
