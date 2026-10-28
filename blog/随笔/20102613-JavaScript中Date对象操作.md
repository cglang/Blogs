---
title: JavaScript Date 对象操作
description: ""
date: 2020-10-26
category: JavaScript
tags: ["JavaScript"]
---

> **注:** 以下代码只在Chromium内核浏览器通过测试，其他浏览器还请自行测试。

## Date 对象

>  创建一个 JavaScript `Date` 的实例，给对象呈现时间中的某个时刻。

> `Date` 对象基于 Unix Time Stamp ，即自1970年1月1日起经过的毫秒数。

<!-- more -->

**创建一个 Date 对象**

```javascript
// 获取一个当前时间的 Date 对象
var date = new Date();
// 从 1970年1月1日经过多少毫秒时间的 Date 对象
var date = new Date(1600000000000);
// 以一个日期字符串创建一个 Date 对象
var date = new Date("2020-2-2 22:22:22.2222");
var date = new Date('December 17, 1995 03:24:00');
var date = new Date('1995-12-17T03:24:00');
// 以年月日时分秒毫秒数字创建
var date = new Date(1995, 11, 17, 3, 24, 0, 100);
```



## 常用操作

### 计算两个日期之间的相差(天/小时/分钟)

```js
var date1 = new Date("2020-2-1 20:00:00");
var date2 = new Date("2020-2-2 20:00:00");
var diffTime = parseInt(date2.getTime() / 1000) - (date1.getTime() / 1000);
var timeDay = parseInt(diffTime / 60 / 60 / 24);        //相差天数
var timeHour = parseInt(diffTime / 60 / 60);            //相差小时
var timeMinutes = parseInt(diffTime / 60);              //相差分钟
```



### 转换日期格式

1. **yyyy-MM-dd hh:mm:ss** 格式

```javascript
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份 
        "d+": this.getDate(),                    //日 
        "h+": this.getHours(),                   //小时 
        "m+": this.getMinutes(),                 //分 
        "s+": this.getSeconds(),                 //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
} 

var formatDate = new Date().format("yyyy-MM-dd hh:mm:ss");
console.log(formatDate);
```

2. **yyyy/MM/dd** 格式

```javascript
var date = new Date().toLocaleDateString();
console.log(date);
```

3. **yyyy年MM月dd日** 格式

> 其实这个格式把 '年月日' 改成 '-' 就成了 yyyy-MM-dd hh:mm:ss 格式

```javascript
var now = new Date(),
y = now.getFullYear(),
m = ("0" + (now.getMonth() + 1)).slice(-2),
d = ("0" + now.getDate()).slice(-2);
var date = y + "年" + m + "月" + d + "日" + now.toTimeString().substr(0, 8);
console.log(date);
```



### 获取年、月、日、周、时、分、秒

```javascript
var date = new Date();
date.getFullYear();		// 年
date.getMonth();		// 月
date.getDate();			// 日
date.getHours();		// 时
date.getMinutes();		// 秒

// 注意 获取年的时候是 getFullYear() 而不是 getYear() 这是个小坑
```



## 其他

详见 [MDN Date](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date)

