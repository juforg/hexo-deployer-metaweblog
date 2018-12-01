# hexo-deployer-metaweblog

metaweblog deployer plugin for [Hexo](http://hexo.io/).

## Installation

``` bash
$ npm install hexo-deployer-metaweblog --save
```

## Options

You can configure this plugin in `_config.yml`.

``` yaml
# You can use this:
deploy:
  type: metaweblog
  blogtype: <cnblog>
  checkdays: 15  # recently days that your posts will be chekck and publish
  username: <username>
  password: <password>
  apiurl: <apiurl>
```

## Known Issues
- only support hexo theme next
- public directory must match "yyyy/mm/dd/blogname/index.html"

## 已知博客
 - 新浪博客的 Publish URL：http://upload.move.blog.sina.com.cn/blog_rebuild/blog/xmlrpc.php
- cnblogs 的 Publish URL：http://www.cnblogs.com/Blog名/services/metaweblog.aspx。其中 Blog 名 请换为您的博客名。cnblogs 的博客后台设置，拉到最下面，也可以找到这个网址。比如说我的是 http://rpc.cnblogs.com/metaweblog/juforg 两者网址不同，但是效果一样。
- oschina 的 Publish URL：https://my.oschina.net/action/xmlrpc

- https://www.npmjs.com/package/cheerio

## To Do

* Handle deleting posts
* ~~ cnblog
[] oschina


### 设计思路

1. 将hexo generate 后的 public 目录中 年份文件夹里的博客内容发送到 支持metaweblog api的博客 如 cnblog
2. 限定只发布最近多少天的博文，省得 几年前的博文也在天天重新发送，通过参数 checkdays 控制 1天 就代表发布昨天和今天的博文,
  - 博客园限定每天只允许调用接口发布100篇
3. cnblog 的postid  不能自己定义，无法确定同一篇博文是去更新还是新建，需要一个对比机制
  - 想到的是弄个文件，里面存放一个json对象，key为博文的名称取md5摘要，value为调用cnblog后返回的postid，可以通过这个文件确定是去创建还是更新博文
  - 这个文件放在 git 插件的发布目录，这样git上还有个备份
4. metaweblog api 有现成的就直接用现成的不去造轮子 `npm i metaweblog-api`
