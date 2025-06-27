## 快速上手

> [!warning]
>
> 因为正在重构，筹备v3，所以v2不会更新太多功能

首先，我们先访问教务系统

[广东工业大学教学管理系统](https://jxfw.gdut.edu.cn/)

登录后，我们按下键盘上的 `F12`，打开控制台后，选择顶上的网络（Network），在左上角搜索框搜索 `login!welcome.action`，然后点击其中的一条记录，选择表头往下滑，找到 `Cookie`，右键右边的内容，点击复制值（Copy Value），如果右键没有复制值（部分浏览器没有这个功能）的话，就按下键盘上的 `Ctrl`+`C` 复制

![image.png](https://cdn.jsdelivr.net/gh/GamerNoTitle/GDUTCourseGrabber/img/v2-1.png)

接着在cookie栏填入刚刚获得的 `JSESSIONID`，然后点击获取课程列表（这个时候Cookie会被保存）

在下方的可选课程列表添加自己需要的课程

![image.png](https://cdn.jsdelivr.net/gh/GamerNoTitle/GDUTCourseGrabber/img/v2-2.png)

添加完成后，在下方设定要开始抢课的时间和提前量，点击保存配置

最后点击开始抢课等着就行了

![image.png](https://cdn.jsdelivr.net/gh/GamerNoTitle/GDUTCourseGrabber/img/v2-3.png)

## 相关解释

> [!important]
>
> Q: 什么是抢课开始时间和提前抢课时间？
>
> A: 抢课开始时间就是学校告诉你的抢课开始的时间，提前抢课时间是提前多少秒开始发送抢课请求。

> [!important]
>
> Q: 我设置了抢课开始时间和提前抢课时间，还需要点击开始抢课嘛？
>
> A: **需要！！！**只有点击了开始抢课，程序才会判断当前时间是否在提前量范围内，如果在提前量范围内则进行请求的发送，否则不发送请求，但仍然处于抢课状态。做这个功能的意义是减小窝工服务器的压力，请不要把提前量设置的过大！！！


## 高级配置

当你第一次打开本程序后，会自动在程序目录下生成config.json文件

```JSON
{
    "account": {
        "cookie": ""
    },
    "delay": 0.5,
    "offset": 300,
    "start_time": null,
    "courses": []
}
```

在这里可以调整延迟，就是这里的delay后面的数字啦，越低延迟越少，但是小心被学校封号~

## 高级功能

> [!warning]
> 
> 警告: 这些功能尚在测试，仅在必要时开启

### 顺序模式

> [!note]
>
> 开启顺序模式将按照添加到列表的顺序进行抢课

此功能适用于对**多个课程**感兴趣并且希望**优先**抢某些课，其他课作为**候补**时使用

### 冲突课程

> [!note]
> 
> 选择冲突课程会在冲突课程已选上时跳过该课程

此功能适用于某个课程有**多个时间可选**或者多个课程**时间冲突**或者只想在某几门课程中**选择其中一门**时使用

## Reference

https://github.com/FoyonaCZY/GDUT_GrabCourse
