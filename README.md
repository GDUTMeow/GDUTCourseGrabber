
<div align="center">
<img src="https://cdn.jsdelivr.net/gh/GDUTMeow/GDUTCourseGrabber@vv3/static/img/favicon.png" height="200px">
<br>
    <h1>GDUTCourseGrabber</h1>
</div>

## 快速上手

首先，我们先访问教务系统

[广东工业大学教学管理系统](https://jxfw.gdut.edu.cn/)

### 登录并添加课程

登录后，我们按下键盘上的`F12`，打开控制台后，点击顶上的应用程序（或写作 `Application`），在左侧点击 `Cookie`，再点击它的子节点 `https://jxfw.gdut.edu.cn`，就能够看到如图所示的 `JSESSIONID`

![](https://cdn.jsdelivr.net/gh/GDUTMeow/GDUTCourseGrabber@vv3/img/msedge_aOT0WhtEZZ.png)

复制下来，填入程序的课程列表顶上的 `JSESSIONID` 输入框，并点击「保存并登录」按钮，如果输入正确的话，按钮上方的状态指示器会显示 `🟢 已登录`

![](https://cdn.jsdelivr.net/gh/GDUTMeow/GDUTCourseGrabber@vv3/img/msedge_uHQEQK2xn3.png)

在下方选择自己想要的课程，点击「添加到列表」；点击查看详情可以查看这门课程的详细信息（包括 `课程名称`、`授课学期`、`授课周次`、`授课星期`、`授课内容类型`、`授课地点`、`授课教师`、`授课节次`）

点击列表最底下的「加载更多」按钮，可以载入更多的课程，当然你也可以修改分页大小，使得每次加载的课程增多

### 添加任务

添加完毕自己想要的课程后，在左侧的导航栏点击「任务添加」选项

![](https://cdn.jsdelivr.net/gh/GDUTMeow/GDUTCourseGrabber@vv3/img/msedge_QpvLSDw6OI.png)

在此处会显示你已经添加的课程列表，你可以在这里进行移除；确认选择的课程与 `JSESSIONID` 是正确的后，修改「任务开始时间」和「抢课延迟」

- 任务开始时间是指什么时候开始发送抢课请求，格式必须为 `YYYY-MM-DD HH:mm:SS`（不懂的自己去了解，这不是程序使用问题的范畴），例如填入 `2024-09-01 12:00:00`，那么程序会在 2024 年 9 月 1 日的中午 12:00 整开始发送抢课请求
- 抢课延迟是每一轮抢课后休息多久，单位为 `秒`，越低延迟越短，对电脑和网络的要求就越高，对服务器的压力也越大
- 自动重试指的是抢课失败是否自动进行重试

确认好上面的内容后，点击添加任务按钮，即可将任务添加到任务列表中

### 启动任务

点击导航栏的「任务状态」，进入任务列表

![](https://cdn.jsdelivr.net/gh/GDUTMeow/GDUTCourseGrabber@vv3/img/msedge_hWXdzYrZrk.png)

在此处会显示你刚刚添加的任务的一些信息，如 `JSESSIONID`、已选课程等

其中状态有如下的三种

- `空闲/完成`：表示任务添加了未开始，或者任务已经完成
- `等待开始`：表示当前时间还没有到你设定的开始时间，任务在等待中
- `正在进行`：表示当前时间已经到达了你设定的开始时间，程序正在抢课

当状态为空闲/完成时，按钮内容显示为「启动」，点击按钮可以开始任务；等待开始/正在进行时，按钮显示为「停止」，点击按钮可以终止任务。

此外，在已选课程的那一列，点击对应的课程，会获取课程的详细信息，并弹出与第一步中点击「查看详情」按钮显示的内容类似的课程详细信息窗口，你可以借此确认你的课程

## Contributors

<div align="center">

| <a href="https://github.com/GamerNoTitle" title="GamerNoTitle"><img src="https://avatars.githubusercontent.com/u/28426291?v=4" width="100px;" alt="GamerNoTitle" style="border-radius: 9999px;" /></a> | <a href="https://github.com/ricky8955555" title="ricky8955555"><img src="https://avatars.githubusercontent.com/u/24487646?v=4" width="100px;" alt="ricky8955555" style="border-radius: 9999px;" /></a> | <a href="https://github.com/KeqingMoe" title="KeqingMoe"><img src="https://avatars.githubusercontent.com/u/59642397?v=4" width="100px;" alt="KeqingMoe" style="border-radius: 9999px;" /></a> | <a href="https://github.com/Ron-1337" title="Ron-1337"><img src="https://avatars.githubusercontent.com/u/53028934?v=4" width="100px;" alt="Ron-1337" style="border-radius: 9999px;" /></a> | <a href="https://github.com/Caramel-Tea" title="Caramel-Tea"><img src="https://avatars.githubusercontent.com/u/194370561?v=4" width="100px;" alt="Caramel-Tea" style="border-radius: 9999px;" /></a> |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|  [GamerNoTitle (Pesy Wu)](https://github.com/GamerNoTitle)   |  [ricky8955555 (Phrinky)](https://github.com/ricky8955555)   |     [KeqingMoe (刻晴Moe)](https://github.com/KeqingMoe)      |        [Ron-1337 (Ron)](https://github.com/Ron-1337)         | [Caramel-Tea (Caramel Tea)](https://github.com/Caramel-Tea)  |

</div>

## Credit

<https://github.com/FoyonaCZY/GDUT_GrabCourse>

<https://tieba.baidu.com/p/9023794849>
