'use strict';

/**
 * easy key val
 * author juforg  juforg@sina.com
 * 通过简单的json文件存储键值对，不需要任何搜索引擎，达到存储和检索的目的
 */
const fs = require('hexo-fs');
const pathFn = require('path')

var Easykv = function() {
    this.kv_path = '';
    this.easykvdata ={}
    this.initstatus = false;
    this.KV_FILENAME= 'easykv-data.json'
    this.kv_dir = ''
}

Easykv.prototype.set_up = function (baseDir,type) {
    this.kv_dir = baseDir;
    this.kv_path = this.kv_dir+type+this.KV_FILENAME
    if(!fs.existsSync(this.kv_dir)){
        fs.mkdirsSync(this.kv_dir)
    }

    if(!fs.existsSync(this.kv_path)){
        fs.closeSync(fs.openSync(this.kv_path, 'w'));
    }
    var that = this
    fs.readFile(this.kv_path).then( function (data) {
        if(data){
            that.easykvdata = JSON.parse(data);
        }
        that.initstatus=true;
    })
}

Easykv.prototype.get = function (key) {
    if(this.initstatus){
       return this.easykvdata[key]
    }else {
        throw new Error("Please call setup first")
    }
}

Easykv.prototype.put = function (key,val) {
    if(this.initstatus){
        this.easykvdata[key]=val
        fs.writeFileSync(this.kv_path,JSON.stringify(this.easykvdata))
    }else {
        throw new Error("Please call setup first")
    }
}
var easykv = new Easykv();
module.exports = easykv;
