import os
import random
import string
import time
import webbrowser
from argparse import ArgumentParser, BooleanOptionalAction
from datetime import datetime, timedelta
from threading import Thread
from typing import Any, Optional

import httpx
from flask import Flask, jsonify, redirect, render_template, request, url_for, Response
from pydantic import BaseModel


class Course(BaseModel):
    """
    课程模型，定义课程的基本属性。
    """
    kcrwdm: int  # 课程任务代码
    kcmc: str    # 课程名称
    teacher: str  # 教师姓名
    preset: bool = False  # 是否为预设课程
    remark: Optional[str] = ""  # 备注信息


class Config(BaseModel):
    class AccountConfig(BaseModel):
        cookie: str = ""
    
    account: AccountConfig = AccountConfig()
    queue_mode: bool = False
    delay: float = 0.5
    offset: int = 300
    start_time: Optional[str] = None
    courses: list[Course] = []


app = Flask(__name__)
app.secret_key = "".join(
    random.choices(string.ascii_letters + string.digits, k=16)
)  # 随机生成 secret_key，用于会话管理

config_path = "config.json"

logs_dir = "logs"
log_file_path = os.path.join(logs_dir, "latest.log")

# 初始化日志目录
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

# 全局变量用于控制抢课任务的运行状态
task_running = False


def load_config() -> Config:
    """
    读取配置文件，如果不存在则创建默认配置并保存。

    Returns:
        Config: 读取或创建的配置对象。
    """
    if not os.path.exists(config_path):
        default = Config()
        save_config(default)
        return default

    with open(config_path, "r", encoding="utf-8") as f:
        json_data = f.read()
        return Config.model_validate_json(json_data)


def save_config(config: Config) -> None:
    """
    保存配置对象到配置文件。

    Args:
        config (Config): 要保存的配置对象。
    """
    with open(config_path, "w", encoding="utf-8") as f:
        json_data = config.model_dump_json(indent=4)
        f.write(json_data)


startup_time = datetime.now()  # 记录应用启动时间
config = load_config()  # 加载配置

# 清空最新日志文件
open(log_file_path, "wt").close()


def log_message(message: str) -> None:
    """
    将消息写入日志文件和带时间戳的新日志文件中。

    Args:
        message (str): 要记录的日志消息。
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}"

    # 追加写入最新日志文件
    with open(log_file_path, "a", encoding="utf-8") as log_file:
        log_file.write(log_entry + "\n")

    # 追加写入带时间戳的日志文件
    filename = startup_time.strftime("%Y-%m-%d %H-%M-%S")
    with open(
        os.path.join(logs_dir, f"{filename}.log"), "a", encoding="utf-8"
    ) as new_log_file:
        new_log_file.write(log_entry + "\n")


async def fetch_courses(cookie: str) -> Any:
    """
    异步获取课程列表。

    Args:
        cookie (str): 用户的 Cookie，用于身份验证。

    Returns:
        Any: 从服务器返回的课程数据（JSON 格式）。
    """
    url = "https://jxfw.gdut.edu.cn/xsxklist!getDataList.action"
    headers = {
        "x-requested-with": "XMLHttpRequest",
        "Cookie": cookie,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://jxfw.gdut.edu.cn",
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": "https://jxfw.gdut.edu.cn/xsxklist!xsmhxsxk.action",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }
    async with httpx.AsyncClient() as client:
        # 第一次请求，获取总记录数
        body = {"sort": "kcrwdm", "order": "asc"}
        response = await client.post(url, headers=headers, params=body)
        response.raise_for_status()
        total = response.json()["total"]

        # 第二次请求，获取所有课程数据
        body = {"sort": "kcrwdm", "order": "asc", "page": "1", "rows": str(total)}
        response = await client.post(url, headers=headers, params=body)
        response.raise_for_status()
        return response.json()


@app.route("/add_course", methods=["POST"])
def add_course() -> Any:
    """
    添加新课程到配置中。

    Returns:
        Any: 添加结果的 JSON 响应。
    """
    log_message(request.json)
    kcrwdm = request.json.get("kcrwdm")
    kcmc = request.json.get("kcmc")
    teacher = request.json.get("teacher", "未知")  # 默认值为'未知'
    preset = request.json.get("preset", "false").lower() == "true"  # 获取 preset 标记
    remark = request.json.get("remark", "")  # 获取备注

    # 校验数据
    if not kcrwdm or not kcmc:
        return jsonify({"error": "课程ID和课程名称不能为空"}), 400

    try:
        kcrwdm = int(kcrwdm)
    except ValueError:
        return jsonify({"error": "无效课程 ID"}), 400

    # 检查课程是否已存在
    if any(course.kcrwdm == kcrwdm for course in config.courses):
        return jsonify({"error": "课程已经存在"}), 400

    # 添加课程到配置
    course = Course(
        kcrwdm=kcrwdm, kcmc=kcmc, teacher=teacher, preset=preset, remark=remark
    )
    config.courses.append(course)
    save_config(config)
    log_message(
        f"添加课程成功，课程ID: {kcrwdm}, 名称: {kcmc}, 老师: {teacher}, 从列表中添加: {preset}"
    )
    return jsonify(
        {
            "success": True,
            "kcrwdm": kcrwdm,
            "kcmc": kcmc,
            "teacher": teacher,
            "preset": preset,
            "remark": remark,
        }
    )


@app.route("/update_remark", methods=["POST"])
def update_remark() -> Any:
    """
    更新指定课程的备注信息。

    Returns:
        Any: 更新结果的 JSON 响应。
    """
    kcrwdm = request.form.get("kcrwdm")
    remark = request.form.get("remark", "")

    if not kcrwdm:
        return jsonify({"error": "课程ID不能为空"}), 400

    try:
        kcrwdm = int(kcrwdm)
    except ValueError:
        return jsonify({"error": "无效课程 ID"}), 400

    # 查找并更新课程备注
    for course in config.courses:
        if course.kcrwdm == kcrwdm:
            course.remark = remark
            save_config(config)
            log_message(f"更新备注成功，课程ID: {kcrwdm}, 备注: {remark}")
            return jsonify({"success": True, "remark": remark})

    return jsonify({"error": "未找到对应的课程"}), 404


def grab_course(course: Course, cookie: str) -> bool:
    """
    执行抢课操作，发送抢课请求。

    Args:
        course (Course): 要抢的课程对象。
        cookie (str): 用户的 Cookie，用于身份验证。

    Returns:
        bool: 如果已经选了该课程，返回 True，否则返回 False。
    """
    url = "https://jxfw.gdut.edu.cn/xsxklist!getAdd.action"
    headers = {
        "Host": "jxfw.gdut.edu.cn",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://jxfw.gdut.edu.cn",
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": "https://jxfw.gdut.edu.cn/xskjcjxx!kjcjList.action",
        "Cookie": cookie,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }

    data = {"kcrwdm": str(course.kcrwdm), "kcmc": course.kcmc}

    try:
        response = httpx.post(url, headers=headers, data=data)
        log_message(
            f"抢课请求发送，课程ID: {course.kcrwdm}, 名称: {course.kcmc}, 老师: {course.teacher}, 响应: {response.text}"
        )
        if "当前不是选课时间" in response.text:
            return False
        if "您已经选了该门课程" in response.text:
            return True
        if "1" in response.text:
            return True
        # 满人了（目前不知道具体的提示是什么，还没遇到）
        if "满" in response.text: 
            return True
        if "超出" in response.text:
            return True

    except Exception as e:
        log_message(f"抢课失败: {e}")

    return False


def start_grab_course_task(config: Config) -> None:
    """
    执行抢课任务的主循环，持续尝试抢指定的课程。

    Args:
        config (Config): 当前的配置对象。
    """
    print ("start_grab_course_task 1")
    try:
        # 解析抢课开始时间
        start_time = datetime.strptime(config.start_time, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return jsonify({"error": "抢课开始时间格式不正确，应为 YYYY-MM-DD HH:MM:SS"}), 400
    
    # 等待抢课开始
    target_time = start_time - timedelta(seconds=config.offset)
    while task_running:
        current_time = datetime.now()
        
        if current_time > target_time:
            break

        log_message(f"当前时间 {current_time.strftime('%Y-%m-%d %H:%M:%S')} 不在预设的抢课时间范围内")
        time.sleep(0.1)
    print ("start_grab_course_task 2")
    if config.queue_mode:
        grab_cours_queue_mode(config)
    else:
        grab_cours_normal_mode(config)
    print ("start_grab_course_task 3")
    stop_grab_course()

def grab_cours_queue_mode(config: Config) -> None:
    """
    顺序抢课:
    按照设置的顺序/优先级进行抢课
    """
    # 重复两遍以确认
    for _ in range(2):
        for course in config.courses:
            while not grab_course(course, config.account.cookie):
                time.sleep(config.delay)  # 延迟，防止请求过于频繁


def grab_cours_normal_mode(config: Config) -> None:
    """
    标准模式:
    正常循环抢课直至没有可抢的课
    """
    finished = set[int]()  # 记录已成功抢到的课程ID

    for course in config.courses:
        if len(finished) == len(config.courses):
            stop_grab_course()
            time.sleep(3)
            log_message("抢课完成！")

        if grab_course(course, config.account.cookie):
            finished.add(course.kcrwdm)

        time.sleep(config.delay)  # 延迟，防止请求过于频繁


def start_grab_course_thread() -> None:
    """
    启动抢课任务的后台线程。
    """
    global task_running
    if not task_running:
        task_running = True
        Thread(target=start_grab_course_task, args=(config,), daemon=True).start()
    log_message("抢课已开始")


def stop_grab_course() -> None:
    """
    停止正在运行的抢课任务。
    """
    global task_running
    task_running = False
    log_message("抢课已停止")


@app.route("/")
def index() -> Any:
    """
    首页路由，渲染主界面，显示配置和最新日志。

    Returns:
        Any: 渲染后的 HTML 模板。
    """
    logs = ""
    if os.path.exists(log_file_path):
        with open(log_file_path, "r", encoding="utf-8") as log_file:
            logs = log_file.readlines()[-100:]  # 读取最后100行日志
    return render_template(
        "index.html", config=config, logs="".join(logs), available_courses=[], start_time=config.start_time, offset=config.offset, queue_mode=config.queue_mode
    )


@app.route("/update_config", methods=["POST"])
def update_config() -> Any:
    """
    更新应用的配置，包括 Cookie、延迟时间、偏移量、抢课开始时间和课程列表。
    
    Returns:
        Any: 重定向到首页的响应。
    """
    cookie = request.form.get("cookie") or ""
    delay = float(request.form.get("delay", 0.5))
    if request.form.get("start_time"):
        start_time = request.form.get("start_time") + ":00"  # 获取抢课开始时间
    else:
        start_time = None
    offset = int(request.form.get("offset", 300))  # 获取偏移量，默认300秒
    queue_mode = request.form.get("queue_mode", "false").lower() == "true"
    try:
        courses = []
        kcrwdm_list = request.form.getlist("kcrwdm")
        kcmc_list = request.form.getlist("kcmc")
        teacher_list = request.form.getlist("teacher")
        preset_list = request.form.getlist("preset")  # 获取 preset 标记
        remark_list = request.form.getlist("remark")  # 获取备注

        for kcrwdm, kcmc, teacher, preset, remark in zip(
            kcrwdm_list, kcmc_list, teacher_list, preset_list, remark_list
        ):
            kcrwdm = int(kcrwdm)
            preset = preset.lower() == "true"
            courses.append(
                Course(
                    kcrwdm=kcrwdm,
                    kcmc=kcmc,
                    teacher=teacher,
                    preset=preset,
                    remark=remark,
                )
            )
    except ValueError:
        return {"error": "参数解析失败"}, 400

    # 更新配置对象
    config.account.cookie = cookie
    config.delay = delay
    if start_time:
        config.start_time = start_time
        config.offset = offset
    config.queue_mode = queue_mode
    config.courses = courses
    save_config(config)
    log_message("配置已更新")
    return redirect(url_for("index"))


@app.route("/fetch_courses", methods=["POST"])
async def fetch_courses_endpoint() -> Any:
    """
    获取最新的课程列表，并返回可用课程的 JSON 数据。

    Returns:
        Any: 包含可用课程列表的 JSON 响应。
    """
    cookie = request.form.get("cookie")

    if not cookie:
        return jsonify({"error": "Cookie 不能为空"}), 400

    # 保存 Cookie 到配置文件
    config.account.cookie = cookie
    save_config(config)
    log_message(f"Cookie 已保存: {cookie}")

    try:
        courses_data = await fetch_courses(cookie)
        available_courses = courses_data.get("rows", [])
        # log_message(f"获取到课程数据：{available_courses}")
        log_message(
            f"获取课程列表成功，共有 {courses_data['total']} 条记录，成功获取 {len(courses_data['rows'])} 条记录"
        )
        return jsonify({"available_courses": available_courses}), 200
    except Exception as e:
        log_message(f"获取课程列表失败: {e}")
        return jsonify({"error": f"获取课程列表失败: {e}"}), 500


@app.route("/fetch_course_detail", methods=["POST"])
async def fetch_course_details() -> Response:
    """
    获取指定课程的详细信息。

    Returns:
        Response: 包含课程详细信息的 JSON 响应。
    """
    course_id = request.json.get("courseId")
    cookie = config.account.cookie
    headers = {
        "Host": "jxfw.gdut.edu.cn",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Origin": "https://jxfw.gdut.edu.cn",
        "DNT": "1",
        "Connection": "keep-alive",
        "Referer": f"https://jxfw.gdut.edu.cn/xsxklist!viewJxrl.action?kcrwdm={course_id}",
        "Cookie": cookie,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }
    course_url = (
        f"https://jxfw.gdut.edu.cn/xsxklist!getJxrlDataList.action?kcrwdm={course_id}"
    )
    response = httpx.get(course_url, headers=headers)
    data = await process_course_detail(response.json())
    if data.get("course_name"):
        body = {"success": True, "msg": "数据获取成功！", "data": data}
    else:
        body = {"success": False, "msg": data.get("extra"), "data": data}
    return jsonify(body)


async def process_course_detail(data: dict | list) -> dict:
    """
    解析课程数据，提取详细信息，并以字典形式返回。

    Args:
        data (dict | list): 一个列表，包含课程数据的字典（来自 JSON 解析后的数据）。

    Returns:
        dict: 包含课程详细信息的字典，如果输入无效，返回包含错误信息的字典。
    """
    WEEKDAY_MAPPING = {
        1: "一",
        2: "二",
        3: "三",
        4: "四",
        5: "五",
        6: "六",
        7: "日"
    }
    try:
        if not isinstance(data, list) or not data:
            return {}

        first_item = data[0]

        course_name = first_item.get("jxbmc")
        term = first_item.get("xnxqmc")
        teach_style = first_item.get("jxhjmc")
        location_type = first_item.get("zdgnqmc")

        # 处理教师姓名，可能存在多个
        teacher_names = set()
        for item in data:
            teacher_names.add(item.get("teaxms"))

        teacher_name = ",".join(teacher_names) if teacher_names else None

        time_segments = []
        locations = set()

        for item in data:
            week = int(item["zc"])
            day = int(item["xq"])
            sessions = sorted(map(int, item["jcdm2"].split(",")))
            location = item["zdjxcdmc"]

            locations.add(location)

            time_segments.append(
                {
                    "week": week,
                    "day": day,
                    "start_session": sessions[0],
                    "end_session": sessions[-1],
                }
            )

        if len(locations) > 1:
            print("警告：课程在多个地点上课")

        # 将所有的时间段按周次排序
        time_segments.sort(key=lambda x: (x["week"], x["day"], x["start_session"]))

        # 合并连续的时间段
        merged_segments = []
        current_segment = None
        for segment in time_segments:
            if current_segment is None:
                current_segment = segment
            elif (
                segment["week"] == current_segment["week"]
                and segment["day"] == current_segment["day"]
                and segment["start_session"] == current_segment["end_session"] + 1
            ):
                current_segment["end_session"] = segment["end_session"]

            else:
                merged_segments.append(current_segment)
                current_segment = segment
        if current_segment:
            merged_segments.append(current_segment)

        # 格式化时间段字符串
        formatted_segments = []

        week_group = {}  # 用于存储周次的哈希映射
        for segment in merged_segments:
            key = (segment["day"], segment["start_session"], segment["end_session"])
            if key in week_group:
                week_group[key].append(segment["week"])
            else:
                week_group[key] = [segment["week"]]

        for key, weeks in week_group.items():
            day, start_session, end_session = key
            if len(weeks) == 1:  # 如果只有一个周次
                formatted_segments.append(
                    f"第{weeks[0]}周 周{WEEKDAY_MAPPING[day]} {start_session}~{end_session}节"
                )
            else:  # 如果有多个周次，需要判断周次是否连续
                weeks.sort()
                start_week = weeks[0]
                end_week = weeks[0]
                week_ranges = []
                for i in range(1, len(weeks)):
                    if weeks[i] == end_week + 1:
                        end_week = weeks[i]
                    else:
                        week_ranges.append((start_week, end_week))
                        start_week = weeks[i]
                        end_week = weeks[i]
                week_ranges.append((start_week, end_week))
                week_range_str = ",".join(
                    [
                        f"第{start}~{end}周" if start != end else f"第{start}周"
                        for start, end in week_ranges
                    ]
                )
                formatted_segments.append(
                    f"{week_range_str} 周{WEEKDAY_MAPPING[day]} {start_session}~{end_session}节"
                )

        course_time = ", ".join(formatted_segments)

        # 返回地点（只返回一个）
        location = locations.pop()

        result = {
            "course_name": course_name,
            "term": term,
            "teach_style": teach_style,
            "teacher_name": teacher_name,
            "location_type": location_type,
            "location": location,
            "course_time": course_time,
        }

        return result

    except (KeyError, TypeError, ValueError) as e:
        print(f"解析数据发生错误：{e}")
        result = {
            "course_name": None,
            "term": None,
            "teach_style": None,
            "teacher_name": None,
            "location_type": None,
            "location": None,
            "course_time": None,
            "extra": str(e),
        }
        return result


@app.route("/start", methods=["POST"])
async def start_grab_course_route() -> Any:
    """
    启动抢课任务的路由。检查当前时间是否在预设的抢课时间范围内。
    
    Returns:
        Any: 启动结果的 JSON 响应。
    """
    if not config.start_time:
        return jsonify({"error": "未设置抢课开始时间"}), 400
    
    try:
        # 解析抢课开始时间
        start_time = datetime.strptime(config.start_time, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return jsonify({"error": "抢课开始时间格式不正确，应为 YYYY-MM-DD HH:MM:SS"}), 400
        
    # 启动抢课任务线程
    start_grab_course_thread()
    return jsonify({"message": "抢课已开始"}), 200



@app.route("/stop", methods=["POST"])
async def stop_grab_course_route() -> Any:
    """
    停止抢课任务的路由。

    Returns:
        Any: 停止成功的 JSON 响应。
    """
    stop_grab_course()
    return jsonify({"message": "抢课已停止"}), 200


@app.route("/latest_log", methods=["GET"])
def latest_log() -> Any:
    """
    获取最新的日志内容。

    Returns:
        Any: 包含最新日志内容的 JSON 响应。
    """
    if not os.path.exists(log_file_path):
        return jsonify({"logs": ""})

    with open(log_file_path, "r", encoding="utf-8") as log_file:
        logs = log_file.readlines()[-100:]  # 读取最后100行日志

    return jsonify({"logs": "".join(logs)})


def open_browser() -> None:
    """
    启动后自动打开默认浏览器并访问应用的首页。
    """
    webbrowser.open_new("http://127.0.0.1:5000")


def main() -> None:
    """
    应用程序的主入口，解析命令行参数并启动 Flask 服务器。
    """
    parser = ArgumentParser()
    parser.add_argument("--debug", default=False, action=BooleanOptionalAction)
    args = parser.parse_args()

    # 在非调试模式下，启动后自动打开浏览器
    if not args.debug or not os.getenv("WERKZEUG_RUN_MAIN"):
        open_browser()

    app.run(debug=args.debug)


if __name__ == "__main__":
    main()
