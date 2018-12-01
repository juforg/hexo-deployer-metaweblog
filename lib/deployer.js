'use strict';
const fs = require('hexo-fs');
// const util = require('hexo-util');
const pathFn = require('path')
const cheerio = require('cheerio')
var chalk = require('chalk');
const md5 = require('md5');
const moment = require('moment')    //AMD规范
var sleep = require('sleep');
var easykv = require('./easykv')

module.exports = function (args, callback) {
    // Hexo's Logger
    let log = this.log

    // Check the user's configuration
    if (!checkHexoConfig(args)) {
        log.error('hexo-deployer-cos: config error')
        return
    }


    var baseDir = this.base_dir;
    var MetaWeblog = require('metaweblog-api');
    var apiUrl = args.apiurl;
    var blogtype = args.blogtype;
    var username = args.username;
    var password = args.password;
    var checkdays = args.checkdays ? args.checkdays : 0;
    var appkey = args.appkey ? args.appkey : '';
    var metaWeblog = new MetaWeblog(apiUrl);
    var uploadFileList = [];
    var publicDir = this.public_dir;
    var blogid;
    var that = this
    var strtmp = "<br />Posted by hexo-deployer-metaweblog"
    var easykvpath = args.easykvpath
    if (!easykvpath) {
        easykvpath = pathFn.join(baseDir, '.deploy_git/assets/')
    }
    easykv.set_up(easykvpath, blogtype)

    metaWeblog.getUsersBlogs(appkey, username, password).then(blogInfos => {
        console.log('\n Method response for \'getUsersBlogs\': ');
        console.log(blogInfos);
        blogid = blogInfos[0].blogid;
        var handlerdata = function (postname, filepath, stat) {
            var a = uploadFileList.push({
                postname: postname,
                // ctime: stat.ctime,
                // mtime: stat.mtime,
                // atime: stat.atime,
                // birthtime: stat.birthtime,
                file: filepath
            });
            // console.log("uploadFileList length "+a)
        }
        // Local files list
        getPostFiles(publicDir, checkdays, handlerdata)
        if (uploadFileList.length < 1) {
            log.info(" no new post to publish last [" + checkyear + "] days")
            return
        }
        var posted_count = 0;
        uploadFileList.forEach(function (filedinfo) {
            var title = filedinfo["postname"]
            var filepath = filedinfo["file"]
            var myHtml = fs.readFileSync(filepath);
            var $ = cheerio.load(myHtml);
            var dateCreatedStr = $('time[itemprop="dateCreated datePublished"]').attr("datetime")
            var mt_keywords = $('meta[name="keywords"]').attr("content")
            var canonical_rul = $('meta[property="og:url"]').attr("content")
            var footer = '<br>/<a href="' + canonical_rul + '" >原文链接</a>'
            // var description = $('meta[name="description"]').attr("content")
            var categories = $('.post-category').children("span[itemprop='name']").text()
            var postid = moment.utc(dateCreatedStr).valueOf() / 1000
            log.info("postid:" + postid + "|title:" + title + "|dateCreatedStr:" + dateCreatedStr + "|mt_keywords:" + mt_keywords + "|categories:" + categories);
            var postcontent = $('div[itemprop=articleBody]').html()
            var post = {
                title: title,
                postid: postid,
                dateCreated: new Date(postid),
                description: postcontent + footer + strtmp,
                categories: [categories],
                permalink: canonical_rul,
                mt_keywords: mt_keywords
            }
            var key = title
            var postid = easykv.get(key)
            sleep.msleep(Math.random(10000) + 40000)
            if (postid) {
                post.postid = postid
                // editPost
                metaWeblog.editPost(String(postid), username, password, post, true)
                    .then(function (success) {
                        log.info("update post:" + postid + " " + success)

                        posted_count++
                    }).catch((error) => {
                    log.error(error.faultString ? error.faultString : error)
                });
            } else {
                metaWeblog.newPost(blogid, username, password, post, true)
                    .then(newPostId => {
                        log.info("newPostId" + newPostId)
                        easykv.put(key, newPostId)
                        posted_count++
                    }).catch((error) => {
                    log.error(error.faultString ? error.faultString : error)
                });
            }

            metaWeblog.getPost(String(postid), username, password).then(function (post) {
                log.info("get posted title:" + post.title + post.permalink)
            }).catch((error) => {
                log.error(error.faultString ? error.faultString : error)

            });

        })
        log.info(" posted " + posted_count + " files")
    }).catch((error) => {
        log.error(blogtype + "--" + username + "--" + error.faultString ? error.faultString : error)
    })

}

/**
 * 检查 Hexo 的配置是否正确
 * @param {string} args
 * @return {boolean} 配置不正确的时候，返回 false
 */
function checkHexoConfig(args) {
    if (!args.blogtype || !args.username || !args.password || !args.apiurl) {
        var help = [
            'You should argsure deployment settings in _config.yml first!',
            '',
            'Example:',
            '  deploy:',
            '    type: metaweblog',
            '    blogtype: cnblog',
            '    username: username',
            '    password: password',
            '    apiurl: apiurl',
            '',
            'For more help, you can check the docs: ' + chalk.underline('http://hexo.io/docs/deployment.html') + ' and ' + chalk.underline('https://help.aliyun.com/document_detail/31867.html?spm=5176.doc31950.2.1.WMtDHS')
        ];
        console.log(help.join('\n'));
        return false
    } else {
        return true
    }
}

/**
 * Get a list of local files by Hexo-fs
 * @param {string} dir
 */
function getPostFiles(dir, checkdays, handlerdata) {
    let files = fs.listDirSync(dir)
    var c = 0;
    var date = new Date();
    var mdate = moment(date)
    var oldestdate = mdate.subtract(checkdays, 'days');
    files.forEach(function (filePath) {

        var absPath = pathFn.join(dir, filePath),
            stat = fs.statSync(absPath);
        if (stat.isDirectory()) {
            console.log("wont handler directory " + absPath)
        } else {
            var suffixpath = filePath.substr(0, 10)
            if (suffixpath.length == 10 && moment(suffixpath, 'YYYY/MM/DD', true).isValid()) {
                if (checkdays > -1) {
                    var oldestdatestr = oldestdate.format('YYYY/MM/DD');
                    if (suffixpath >= oldestdatestr) {
                        // console.log("oldestdatestr:"+oldestdatestr+"|suffixpath:"+suffixpath)
                        getFileInfo(absPath, absPath, handlerdata)
                        c++;
                    }
                } else {
                    getFileInfo(absPath, absPath, handlerdata)
                    c++;
                }

            }
        }
    });
    console.log("handled " + c + " posts")
}

function getFileInfo(absPath, dir, handlerdata) {
    var pathArr = dir.split(pathFn.sep)
    var filename = pathArr[pathArr.length - 1]
    var absPath = pathFn.join(absPath, dir),
        stat = '';//fs.fstat(absPath)
    ;
    var realfilename;
    if ('index.html' == filename) {
        realfilename = pathArr[pathArr.length - 2]
    } else {
        realfilename = filename
    }
    handlerdata(realfilename, dir, stat)
}

function recursionfilepath(dir, handler) {
    let files = fs.listDirSync(dir)
    files.forEach(function (filePath) {
        var absPath = pathFn.join(dir, filePath),
            stat = fs.statSync(absPath);
        if (stat.isDirectory()) {
            recursionfilepath(absPath, handler);
        } else if (stat.isFile()) {
            var realfilename;
            var filename = absPath.substr(absPath.lastIndexOf(pathFn.sep))
            console.log(filename);
            log.error(filename)
            var pathArr = absPath.split(pathFn.sep),
                rootIndex = pathArr.indexOf(root);
            if ('index.html' == filename) {
                // realfilename = pathArr[pathArr.length-2]
            } else {
                // realfilename=filename
            }
            // handler(realfilename,absPath,stat)
        }
    });
}
