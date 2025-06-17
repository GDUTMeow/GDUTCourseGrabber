globalLoading = document.getElementById('global-loading');
globalCurrentPage = document.getElementById('current-page');
globalCurrentCount = document.getElementById('current-count');
globalPageSize = 20;
globalLoggedIn = false;
globalCourses = [];

function toggleSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn.value === '1') {
        menuBtn.innerHTML = `
        <svg viewBox="0 -960 960 960">
            <path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"></path>
        </svg>
        `;
        menuBtn.value = '0';
    } else {
        menuBtn.innerHTML = `
        <svg viewBox="0 -960 960 960">
            <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"></path>
        </svg>
        `;
        menuBtn.value = '1';
    }
    document.querySelector('s-drawer').toggle();
}

function openGithub() {
    window.open('https://github.com/GDUTMeow/GDUTCourseGrabber', '_blank');
}

function openGDUT() {
    window.open('https://www.gdut.edu.cn', '_blank');
}

function openGDUTJW() {
    window.open('https://jxfw.gdut.edu.cn/login!welcome.action', '_blank');
}

function showDialog(title, content, level) {
    const dialog = document.getElementById('dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogContent = document.getElementById('dialog-descr');

    if (level === 'error') {
        dialogTitle.innerText = `🔴 ${title}`;
    } else if (level === 'success') {
        dialogTitle.innerText = `🟢 ${title}`;
    } else {
        dialogTitle.innerText = `🔵 ${title}`;
    }

    dialogContent.innerText = content;
    dialog.setAttribute('showed', 'true');
}

function changePanel(panelId) {
    const panels = ['courses-panel', 'operation-panel'];
    panels.forEach((id, index) => {
        const panel = document.getElementById(id);
        if (index === panelId) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
        if (panelId === 'operation-panel') {
            const table_body = document.getElementById('selected-table-body');
            globalCourses.forEach(course => {
                const table_line = document.createElement('s-tr');
                const name_td = document.createElement('s-td');
                const teacher_td = document.createElement('s-td');
                const class_time_td = document.createElement('s-td');
                const operation_td = document.createElement('s-td');
                const remove_btn = document.createElement('s-button');

                name_td.innerText = course.name + ' (' + course.id + ')';
                teacher_td.innerText = course.teacher;

                class_time_td.innerText = `星期 ${course.day} 第 ${course.sessions.start} 节 - 第 ${course.sessions.end} 节`;

                remove_btn.innerText = '移除';
                remove_btn.setAttribute('classId', String(course.id));
                remove_btn.setAttribute('onclick', "removeCourse(this.getAttribute('classId'))");
                remove_btn.setAttribute('type', 'outlined');

                operation_td.appendChild(remove_btn);

                table_line.appendChild(name_td);
                table_line.appendChild(id_td);
                table_line.appendChild(teacher_td);
                table_line.appendChild(operation_td);

                table_body.appendChild(table_line);
            })
        }
    });
}

function initialize() {
    const cookieField = document.getElementById('cookie');
    if (localStorage.getItem('cookie')) {
        cookieField.value = localStorage.getItem('cookie');
    }
    globalCurrentCount.innerText = '0';
    globalCurrentPage.innerText = '0';
}

function saveAndLogin() {
    const cookieField = document.getElementById('cookie');
    if (!cookieField.value) {
        showDialog('错误', '请先输入 JSESSIONID 再进行登录', 'error');
        return;
    }

    login(cookieField.value);
}

function login(cookie) {
    const saveBtn = document.getElementById('save-config-btn');
    const loadingIndicator = document.getElementById('save-config-btn-loading');
    saveBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    fetch('/api/eas/courses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            {
                count: 1,
                page: 1,
                session_id: cookie,
            }
        )
    }).then(response => {
        if (response.ok) {
            globalLoggedIn = true;
            localStorage.setItem('cookie', cookie);
            saveBtn.disabled = false;
            loadingIndicator.classList.add('hidden');
            return true;
        } else if (response.status === 422) {
            showDialog('错误', '登录失败：请检查 JSESSIONID 是否正确或是否过期，然后重试', 'error');
            saveBtn.disabled = false;
            loadingIndicator.classList.add('hidden');
            globalLoggedIn = false;
            return false;
        }
    }).catch(error => {
        globalLoggedIn = false;
        saveBtn.disabled = false;
        loadingIndicator.classList.add('hidden');
        showDialog('错误', `登录失败，请稍后重试或查看控制台\n${error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
        console.error('登录失败:', error);
        return false;
    })
}

function onChangePageSize(size, custom = false) {
    if (!custom) {
        document.getElementById('custom-page-size-input').classList.add('hidden');
        document.getElementById('custom-page-size-btn').classList.add('hidden');
    }
    globalPageSize = Number(size);
}

function onCustomPageSizeChecked() {
    document.getElementById('custom-page-size-input').classList.remove('hidden');
    document.getElementById('custom-page-size-input').value = "";
    document.getElementById('custom-page-size-btn').classList.remove('hidden');
}

/*
通过服务器获取更多的课程
@param {number} page - 页码，默认为1
@param {number} size - 每页课程数量，默认为20
@param {boolean} positive - 是否为用户主动获取，默认为true 
*/
function fetchNewCourses(page = 1, size = 20, positive = true) {
    const loadingIndicator = document.getElementById('save-config-btn-loading');
    const saveBtn = document.getElementById('save-config-btn');
    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return;
    }
    const cookie = localStorage.getItem('cookie');
    fetch('/api/eas/courses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            count: size,
            page: page,
            session_id: cookie,
        })
    }).then(response => {
        if (response.ok) {
            globalLoggedIn = true;
            localStorage.setItem('cookie', cookie); // 成功登录时保存 Cookie
            loadingIndicator.classList.add('hidden');
            saveBtn.disabled = false;
            return true; // 登录成功，解决 Promise
        } else if (response.status === 422) {
            globalLoggedIn = false;
            loadingIndicator.classList.add('hidden');
            saveBtn.disabled = false;
            // 登录失败，拒绝 Promise，并传递错误信息
            return Promise.reject(new Error('JSESSIONID incorrect or expired'));
        } else {
            globalLoggedIn = false;
            loadingIndicator.classList.add('hidden');
            saveBtn.disabled = false;
            // 其他 HTTP 错误，拒绝 Promise
            return Promise.reject(new Error(`Server responded with status: ${response.status}`));
        }
    })
        .catch(error => {
            globalLoggedIn = false;
            loadingIndicator.classList.add('hidden');
            saveBtn.disabled = false;
            console.error('登录失败:', error);
            showDialog('错误', `登录失败，请稍后重试或查看控制台\n${error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
            return Promise.reject(new Error(`网络或服务器连接失败: ${error.message || error}`)); // 重新抛出错误
        });
}

function loadMoreCourses() {
    const currentPage = Number(globalCurrentPage.innerText);
    const newPage = currentPage + 1;
    data = fetchNewCourses(newPage, globalPageSize, true);
    if (data) {
        data = data.data;
        data.forEach(course => {
            addLineToCourseTable(
                course.name,
                course.id,
                course.teacher,
                course.category,
                course.selected,
                course.limit
            );
        })
    }
    globalCurrentPage.innerText = newPage.toString();
}

function addLineToCourseTable(name, id, teacher, category, selected, limit) {
    const table_body = document.getElementById('content-table-body');
    const table_line = document.createElement('s-tr');
    const operation_td = document.createElement('s-td');
    const add_btn = document.createElement('s-button');
    const detail_btn = document.createElement('s-button');

    add_btn.innerText = '添加到列表';
    add_btn.setAttribute('type', 'outlined');
    add_btn.setAttribute('classId', String(id));
    add_btn.setAttribute('onclick', `addCourse(this.getAttribute('classId'))`);
    add_btn.style.marginRight = '8px';

    detail_btn.innerText = '查看详情';
    detail_btn.setAttribute('classId', String(id));
    detail_btn.setAttribute('onclick', "showCourseDetail(this.getAttribute('classId'))");

    const limit_td = document.createElement('s-td');
    const limit_linear = document.createElement('s-linear-progress');
    if (limit === "?" || selected === "?") {
        limit_linear.setAttribute('value', '100');
    } else {
        limit_linear.setAttribute('value', String(selected / limit * 100));
    }
    limit_td.innerText = `${selected}/${limit}`;
    limit_td.appendChild(limit_linear);

    operation_td.appendChild(add_btn);
    operation_td.appendChild(detail_btn);

    // 操作 DOM 添加
    table_line.appendChild(document.createElement('s-td')).innerText = `${name} (${id})`;
    table_line.appendChild(document.createElement('s-td')).innerText = teacher;
    table_line.appendChild(document.createElement('s-td')).innerText = category;
    table_line.appendChild(limit_td);
    table_line.appendChild(operation_td);

    table_body.appendChild(table_line);
}

function fetchCourseDetail(classId, positive=true) {
    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return;
    }
    fetch("/api/eas/courses/" + classId + "/lessons", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: localStorage.getItem('cookie'),
        })
    }).then(response => {
        if (response.ok) {
                const data = response.json().data;
                const name = data.name; // 课程名称
                const term = data.term; // 授课学期
                const week = data.week; // 授课周次
                const day = data.day;   // 授课星期
                const content_type = data.content_type; // 授课内容类型
                const location_type = data.location_type; // 授课地点类型
                const location = data.location; // 授课地点
                const teacher = data.teacher; // 授课教师
                const sessions = data.sessions; // 授课节次
            if (positive) {
                const message = `
                课程名称: ${name}\n
                授课学期: ${term}\n
                授课周次: ${week} 周\n
                授课星期: 星期${day}\n
                授课内容类型: ${content_type}\n
                授课地点: ${location} (${location_type})\n
                授课教师: ${teacher}\n
                授课节次: 第 ${sessions.start} 节 - 第 ${sessions.end} 节
                `
                showDialog('课程详情', message);
            } else {
                return {
                    name: name,
                    term: term,
                    week: week,
                    day: day,
                    content_type: content_type,
                    location_type: location_type,
                    location: location,
                    teacher: teacher,
                    sessions: sessions
                };
            }
        } else {
            showDialog('错误', `获取课程详情失败，请稍后重试或查看控制台。`, 'error');
            if (!positive) {
                return false;
            }
            throw new Error(`Error fetching course details: ${response.status}`);
        }
    }).catch(error => {
        console.error('获取课程详情失败:', error);
        if (positive) {
            showDialog('错误', `获取课程详情失败，请稍后重试或查看控制台\n${error}`, 'error');
        } else {
            return false;
        }
    })
}

function addCourse(classId) {
    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return;
    }
    fetchCourseDetail(classId, false).then(data => {
        if (data) {
            course = data;
            globalCourses.push(course);
            showDialog('成功', `课程 ${course.name} (${classId}) 已成功添加到列表。`, 'success');
        } else {
            showDialog('错误', '无法获取课程详细信息，课程添加失败，请稍后重试或查看控制台。', 'error');
            return;
        }
    });
}

function initializeSelectedCourseTable() {

}