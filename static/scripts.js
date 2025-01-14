const showDialog = (title, msg) => {
    const dialog = document.querySelector("#dialog");
    const dialogTitle = dialog.querySelector(".dialog-title");
    const dialogContent = dialog.querySelector(".dialog-content");
    const closeButton = document.getElementById("dialog-close");

    dialogTitle.textContent = title;
    dialogContent.innerHTML = msg;

    // 显示对话框
    if (typeof dialog.showModal === "function") {
        dialog.showModal();
        document.body.style.overflow = "hidden"; // 禁用背景滚动
    } else {
        alert("对不起，您的浏览器不支持 <dialog> 元素。");
    }

    // 关闭按钮事件
    closeButton.onclick = () => {
        dialog.close();
        document.body.style.overflow = "auto"; // 恢复背景滚动
    };

    dialog.addEventListener('click', (event) => {
        if (event.target === dialog || event.target === dialog.querySelector('.dialog-body')) {
            dialog.close();
            document.body.style.overflow = "auto"; // 恢复背景滚动
            dialog.style.display = 'flex';
        }
    });
};

// 添加分页相关的全局变量
let currentPage = 1;
let pageSize = 10;
let allCourses = [];

document.addEventListener("DOMContentLoaded", function () {
    document
        .getElementById("fetch-courses-btn")
        .addEventListener("click", fetchCourses);
    document.getElementById("start-qk-btn").addEventListener("click", start);
    document.getElementById("stop-qk-btn").addEventListener("click", stop);

    // 添加分页控件的事件监听
    document.getElementById("prev-page").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchCourses();
            displayCurrentPage();
                }
                dialogContentContainer.style.display = 'table';
                if (typeof dialog.showModal === "function") {
                    dialog.showModal();
                } else {
                    alert("对不起，您的浏览器不支持 <dialog> 元素。");
                }
            })
            .catch((error) => {
                console.error("获取配置失败:", error);
                showDialog("错误", "获取配置失败，请查看控制台错误信息。");
            });
    });

    document.getElementById("page-size").addEventListener("change", (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // 重置到第一页
        fetchCourses();
        displayCurrentPage();
        updatePagination();
    });

    const storedSessionId = localStorage.getItem("sessionId");
    if (storedSessionId) {
        document.getElementById("session_id").value = storedSessionId;
    }
});

function addCourseEntry() {
    const courseEntry = document.createElement("div");
    courseEntry.className = "course-entry";
    courseEntry.innerHTML = `
        <input type="text" name="kcrwdm" placeholder="课程ID" required>
        <input type="text" name="kcmc" placeholder="课程名称" required>
        <input type="text" name="teacher" placeholder="老师名字" required>
        <input type="text" name="remark" placeholder="备注">
        <input type="hidden" name="preset" value="false">
        <button type="button" class="btn remove-course" onclick="this.parentElement.remove()">-</button>
    `;
    document.getElementById("courses-container").appendChild(courseEntry);
    checkCoursesCount();
}

function checkCoursesCount() {
    const courseEntries = document.querySelectorAll(".course-entry");
    const removeButtons = document.querySelectorAll(".remove-course");

    if (courseEntries.length <= 1) {
        removeButtons.forEach((button) => {
            button.disabled = false;
        });
    } else {
        removeButtons.forEach((button) => {
            button.disabled = false;
        });
    }
}

function fetchCourses() {
    const sessionId = document.getElementById("session_id").value;
    if (!sessionId) {
        showDialog("提示", "请先输入 JSESSIONID");
        return;
    }
    localStorage.setItem("sessionId", sessionId);
    const url = new URL(window.location.origin + "/api/eas/courses");
    url.searchParams.append("count", pageSize);
    url.searchParams.append("page", currentPage);
    url.searchParams.append("session_id", sessionId);

    fetch(url, {
        method: "GET",
        headers: {
            accept: "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                showDialog("错误", data.error);
            } else if (data.data && data.data.length === 0) {
                showDialog("提示", "成功获取了课程列表，但是课程列表为空");
            } else {
                updateAvailableCourses(data.data);
            }
        })
        .catch((error) => {
            console.error("获取课程列表失败:", error);
            showDialog("错误", "获取课程列表失败，请查看控制台错误信息。");
        });
}

function updateAvailableCourses(courses) {
    allCourses = courses; // 保存所有课程数据
    updatePagination();
    displayCurrentPage();
}

function displayCurrentPage() {
    const tableBody = document.getElementById("available-courses-list");
    tableBody.innerHTML = ""; // 清空当前列表

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, allCourses.length);

    for (let i = start; i < end; i++) {
        const course = allCourses[i];
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${course.kcrwdm}</td>
            <td>${course.kcmc} (${course.xf}分)</td>
            <td>${course.xmmc}</td>
            <td>${course.teaxm}</td>
            <td>${course.pkrs}</td>
            <td>
                <form action="/add_course" method="post">
                    <input type="hidden" name="kcrwdm" value="${course.kcrwdm}">
                    <input type="hidden" name="kcmc" value="${course.kcmc}">
                    <input type="hidden" name="teacher" value="${course.teaxm || "未知"
            }">
                    <input type="hidden" name="preset" value="true">
                    <input type="hidden" name="remark" value="">
                    <button type="submit" class="btn">添加</button>
                    <button type="button" class="btn show-detail" onclick="showDetail('${course.kcrwdm
            }')">详细信息</button>
                </form>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

function updatePagination() {
    const totalPages = Math.ceil(allCourses.length / pageSize);
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    const currentPageSpan = document.getElementById("current-page");
    const totalPagesSpan = document.getElementById("total-pages");

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function start() {
    fetch("/start", {
        method: "POST",
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                showDialog("错误", data.error);
            } else {
                showDialog("信息", data.message);
            }
        })
        .catch((error) => {
            console.error("启动抢课失败:", error);
            showDialog("错误", "启动抢课失败，请查看控制台错误信息。");
        });
}

function stop() {
    fetch("/stop", {
        method: "POST",
    })
        .then((response) => response.json())
        .then((data) => {
            showDialog("信息", data.message);
        })
        .catch((error) => {
            console.error("停止抢课失败:", error);
            showDialog("错误", "停止抢课失败，请查看控制台错误信息。");
        });
}

async function fetchLogs() {
    try {
        let response = await fetch("/latest_log");
        let data = await response.json();
        let logContainer = document.getElementById("log-shell");
        logContainer.innerHTML = "<pre>" + data.logs + "</pre>";

        // 自动滚动到底部
        logContainer.scrollTop = logContainer.scrollHeight;
    } catch (error) {
        console.error("获取日志失败:", error);
    }
}

function showDetail(courseId) {
    fetch("/fetch_course_detail", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            courseId: courseId,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Received data:", data); // 调试信息
            if (data.success) {
                const courseDetail = data.data;
                console.log("Course Detail:", courseDetail); // 调试信息
                const detailHTML = `
                <p><strong>课程名称:</strong> ${courseDetail.course_name || "N/A"
                    }</p>
                <p><strong>学期:</strong> ${courseDetail.term || "N/A"}</p>
                <p><strong>教学方式:</strong> ${courseDetail.teach_style || "N/A"
                    }</p>
                <p><strong>教师:</strong> ${courseDetail.teacher_name || "N/A"
                    }</p>
                <p><strong>教室类别:</strong> ${courseDetail.location_type || "N/A"
                    }</p>
                <p><strong>上课地点:</strong> ${courseDetail.location || "N/A"
                    }</p>
                <p><strong>上课时间:</strong> ${courseDetail.course_time || "N/A"
                    }</p>
            `;
                showDialog("课程详细信息", detailHTML);
            } else {
                showDialog("错误", `获取课程详细信息失败: ${data.msg}`);
            }
        })
        .catch((error) => {
            console.error("获取课程详细信息失败:", error);
            showDialog("错误", "获取课程详细信息失败，请查看控制台错误信息。");
        });
}

function startPolling() {
    fetchLogs();
    setInterval(fetchLogs, 500); // 每0.5秒刷新一次
}

// 保存备注功能
function saveRemark(kcrwdm) {
    const courseEntry = document.querySelector(
        `input[name="kcrwdm"][value="${kcrwdm}"]`
    ).parentElement;
    const remarkInput = courseEntry.querySelector('input[name="remark"]');
    const remark = remarkInput.value;

    fetch("/update_remark", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            kcrwdm: kcrwdm,
            remark: remark,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                showDialog("错误", data.error);
            } else {
                showDialog("信息", "备注已保存");
            }
        })
        .catch((error) => {
            console.error("保存备注失败:", error);
            showDialog("错误", "保存备注失败，请查看控制台错误信息。");
        });
}

function saveGrabCourseConfig() {
    const startTimeInput = document.getElementById("start-time").value;
    const offsetInput = document.getElementById("offset").value;

    if (!startTimeInput) {
        showDialog("错误", "请设置抢课开始时间。");
        return;
    }

    if (!offsetInput || isNaN(offsetInput) || parseInt(offsetInput) < 0) {
        showDialog("错误", "请设置有效的抢课提前时间（秒）。");
        return;
    }

    // 获取表单数据
    const form = document.getElementById("config-form");
    const formData = new FormData(form);

    // 添加或更新 start_time 和 offset
    formData.set("start_time", startTimeInput.replace("T", " ")); // 转换为 "YYYY-MM-DD HH:MM:SS" 格式
    formData.set("offset", offsetInput);

    // 发送保存配置的请求
    fetch("/update_config", {
        method: "POST",
        body: formData,
    })
        .then((response) => {
            if (response.redirected) {
                window.location.href = response.url; // 重定向到首页
            } else {
                return response.json();
            }
        })
        .then((data) => {
            if (data && data.error) {
                showDialog("错误", data.error);
            } else {
                showDialog("信息", "抢课配置已保存");
            }
        })
        .catch((error) => {
            console.error("保存抢课配置失败:", error);
            showDialog("错误", "保存抢课配置失败，请查看控制台错误信息。");
        });
}
document
    .getElementById("fetch-config-btn")
    .addEventListener("click", function () {
        const url = window.location.origin + "/api/grabber/";
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                console.log("Configuration:", data);
                const config = data.data;
                let startTimeValue = "";
                let offsetValue = "";
                if (config && config.config) {
                    startTimeValue = config.config.start_at || "";
                    offsetValue = config.config.delay
                        ? config.config.delay.replace("PT", "").replace("S", "")
                        : "";
                }
                let dialogContent = `
                <div class="dialog-body">
                    <div class="grab-course-config">
                        <label for="start-time-config">抢课开始时间:</label>
                        <input type="datetime-local" id="start-time-config" name="start_time" value="${startTimeValue}">
                        <label for="offset-config">提前抢课时间 (秒):</label>
                        <input type="number" class="offset" id="offset-config" name="offset" min="0" value="${offsetValue}">
                        <br><br>
                    </div>
                    <hr>
                    <h2>当前课程列表</h2>
                    <button type="button" class="add-course-btn" onclick="addCourseEntry()">添加自定义课程 +</button>
                    <table id="config-table">
                        <thead>
                            <tr>
                                <th>课程名称(代码)</th>
                                <th>授课老师</th>
                                <th>上课时间/地点</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
                `;
                const dialog = document.querySelector('#dialog');
                const dialogTitle = dialog.querySelector('.dialog-title');
                const dialogContentContainer = dialog.querySelector('.dialog-content');
                dialogTitle.textContent = '修改当前配置';
                dialogContentContainer.innerHTML = dialogContent;
                const tableBody = document.querySelector("#config-table tbody");
                tableBody.innerHTML = '';
                if (config && config.courses && config.courses.length > 0) {
                    config.courses.forEach((course) => {
                        const row = document.createElement("tr");
                        let courseName = course.name;
                        if (course.source === 1) {
                            courseName = `<input type="text" name="name" value="${course.name || ''}">`;
                        }
                        row.innerHTML = `
                            <td>${courseName} (${course.id})</td>
                            <td>${course.teacher}</td>
                            <td></td>
                            <td><input type="text" name="note" value="${course.note || ''}"></td>
                            <td>
                                <button type="button" class="btn remove-course" onclick="this.parentElement.parentElement.remove()">移除</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
                dialog.style.display = 'table';
                if (typeof dialog.showModal === "function") {
                    dialog.showModal();
                } else {
                    alert("对不起，您的浏览器不支持 <dialog> 元素。");
                }
            })
            .catch((error) => {
                console.error("获取配置失败:", error);
                showDialog("错误", "获取配置失败，请查看控制台错误信息。");
            });
    });
