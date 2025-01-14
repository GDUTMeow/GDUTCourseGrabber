const showDialog = (title, msg) => {
    const dialog = document.querySelector('#dialog');
    const dialogTitle = document.querySelector('#dialog .dialog-title');
    const dialogBody = document.querySelector('#dialog .dialog-content');
    dialogTitle.textContent = title;
    dialogBody.innerHTML = msg;
    dialog.showModal();
}

const showConfirmDialog = (title, msg) => {
    const dialog = document.querySelector('#confirm-dialog');
    const dialogTitle = document.querySelector('#confirm-dialog .dialog-title');
    const dialogBody = document.querySelector('#confirm-dialog .dialog-content');
    const yes = document.querySelector('#confirm-dialog-yes');
    const no = document.querySelector('#confirm-dialog-no');
    const promise = new Promise(res => {
        const yesCallback = () => {
            res(true);
            clearCallback();
        };
        const noCallback = () => {
            res(false);
            clearCallback();
        };
        const clearCallback = () => {
            console.log('clear callback');
            yes.removeEventListener('click', yesCallback);
            no.removeEventListener('click', noCallback);
            dialog.close();
        }
        yes.addEventListener('click', yesCallback);
        no.addEventListener('click', noCallback);
    });
    
    dialogTitle.textContent = title;
    dialogBody.textContent = msg;
    dialog.showModal();
    return promise;
}

// 添加分页相关的全局变量
let currentPage = 1;
let pageSize = 10;
let allCourses = [];

document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".add-course").addEventListener("click", function() {
        addCourseEntry();
    });
    document.getElementById("fetch-courses-btn").addEventListener("click", fetchCourses);
    document.getElementById("start-qk-btn").addEventListener("click", start);
    document.getElementById("stop-qk-btn").addEventListener("click", stop);
    document.getElementById("save-config-btn").addEventListener("click", saveGrabCourseConfig);
    checkCoursesCount();

    // 添加分页控件的事件监听
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayCurrentPage();
            updatePagination();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(allCourses.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayCurrentPage();
            updatePagination();
        }
    });

    document.getElementById('page-size').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // 重置到第一页
        displayCurrentPage();
        updatePagination();
    });
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
        removeButtons.forEach(button => {
            button.disabled = false;
        });
    } else {
        removeButtons.forEach(button => {
            button.disabled = false;
        });
    }
}

function fetchCourses() {
    const cookie = document.getElementById("cookie").value;
    if (!cookie) {
        showDialog('提示', "请先输入 Cookie");
        return;
    }
    // showDialog('信息', "正在获取课程，请耐心等待，获取时间视课程量而定");
    fetch('/fetch_courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ 'cookie': cookie })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showDialog('错误', data.error);
            } else {
                updateAvailableCourses(data.available_courses);
            }
        })
        .catch(error => {
            console.error('获取课程列表失败:', error);
            showDialog('错误', '获取课程列表失败，请查看控制台错误信息。');
        });
}

function updateAvailableCourses(courses) {
    allCourses = courses; // 保存所有课程数据
    updatePagination();
    displayCurrentPage();
}

function displayCurrentPage() {
    const tableBody = document.getElementById("available-courses-list");
    tableBody.innerHTML = ''; // 清空当前列表

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, allCourses.length);
    
    for (let i = start; i < end; i++) {
        const course = allCourses[i];
        const row = document.createElement('tr');
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
                    <input type="hidden" name="teacher" value="${course.teaxm || '未知'}">
                    <input type="hidden" name="preset" value="true">
                    <input type="hidden" name="remark" value="">
                    <button type="submit" class="btn">添加</button>
                    <button type="button" class="btn show-detail" onclick="showDetail(${course.kcrwdm})">详细信息</button>
                </form>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

function updatePagination() {
    const totalPages = Math.ceil(allCourses.length / pageSize);
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function start() {
    fetch('/start', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showDialog('错误', data.error);
            } else {
                showDialog('信息', data.message);
            }
        })
        .catch(error => {
            console.error('启动抢课失败:', error);
            showDialog('错误', '启动抢课失败，请查看控制台错误信息。');
        });
}

function stop() {
    fetch('/stop', {
            method: 'POST',
        })
        .then(response => response.json())
        .then(data => {
            showDialog('信息', data.message);
        })
        .catch(error => {
            console.error('停止抢课失败:', error);
            showDialog('错误', '停止抢课失败，请查看控制台错误信息。');
        });
}

async function fetchLogs() {
    try {
        let response = await fetch('/latest_log');
        let data = await response.json();
        let logContainer = document.getElementById('log-shell');
        logContainer.innerHTML = "<pre>" + data.logs + "</pre>";

        // 自动滚动到底部
        logContainer.scrollTop = logContainer.scrollHeight;
    } catch (error) {
        console.error('获取日志失败:', error);
    }
}

function showDetail(courseId) {
    fetch('/fetch_course_detail', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            courseId: courseId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Received data:', data); // 调试信息
        if (data.success) {
            const courseDetail = data.data;
            console.log('Course Detail:', courseDetail); // 调试信息
            const detailHTML = `
                <p><strong>课程名称:</strong> ${courseDetail.course_name || 'N/A'}</p>
                <p><strong>学期:</strong> ${courseDetail.term || 'N/A'}</p>
                <p><strong>教学方式:</strong> ${courseDetail.teach_style || 'N/A'}</p>
                <p><strong>教师:</strong> ${courseDetail.teacher_name || 'N/A'}</p>
                <p><strong>教室类别:</strong> ${courseDetail.location_type || 'N/A'}</p>
                <p><strong>上课地点:</strong> ${courseDetail.location || 'N/A'}</p>
                <p><strong>上课时间:</strong> ${courseDetail.course_time || 'N/A'}</p>
            `;
            showDialog('课程详细信息', detailHTML);
        } else {
            showDialog('错误', `获取课程详细信息失败: ${data.msg}`);
        }
    })
    .catch(error => {
        console.error('获取课程详细信息失败:', error);
        showDialog('错误', '获取课程详细信息失败，请查看控制台错误信息。');
    });
}

function startPolling() {
    fetchLogs();
    setInterval(fetchLogs, 500); // 每0.5秒刷新一次
}

window.onload = startPolling;

// 保存备注功能
function saveRemark(kcrwdm) {
    const courseEntry = document.querySelector(`input[name="kcrwdm"][value="${kcrwdm}"]`).parentElement;
    const remarkInput = courseEntry.querySelector('input[name="remark"]');
    const remark = remarkInput.value;

    fetch('/update_remark', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'kcrwdm': kcrwdm,
                'remark': remark
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showDialog('错误', data.error);
            } else {
                showDialog('信息', '备注已保存');
            }
        })
        .catch(error => {
            console.error('保存备注失败:', error);
            showDialog('错误', '保存备注失败，请查看控制台错误信息。');
        });
}

// 新增：保存抢课配置功能
function saveGrabCourseConfig() {
    const startTimeInput = document.getElementById("start-time").value;
    const offsetInput = document.getElementById("offset").value;

    if (!startTimeInput) {
        showDialog('错误', '请设置抢课开始时间。');
        return;
    }

    if (!offsetInput || isNaN(offsetInput) || parseInt(offsetInput) < 0) {
        showDialog('错误', '请设置有效的抢课提前时间（秒）。');
        return;
    }

    // 获取表单数据
    const form = document.getElementById("config-form");
    const formData = new FormData(form);

    // 添加或更新 start_time 和 offset
    formData.set('start_time', startTimeInput.replace('T', ' ')); // 转换为 "YYYY-MM-DD HH:MM:SS" 格式
    formData.set('offset', offsetInput);

    // 发送保存配置的请求
    fetch('/update_config', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url; // 重定向到首页
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (data && data.error) {
                showDialog('错误', data.error);
            } else {
                showDialog('信息', '抢课配置已保存');
            }
        })
        .catch(error => {
            console.error('保存抢课配置失败:', error);
            showDialog('错误', '保存抢课配置失败，请查看控制台错误信息。');
        });
}
