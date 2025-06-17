// 全局DOM元素引用
globalLoading = document.getElementById('global-loading');
globalCurrentPage = document.getElementById('current-page');
globalCurrentCount = document.getElementById('current-count');

// 全局配置
globalPageSize = 20;
globalLoggedIn = false;
globalCourses = []; // 用于存储用户已选择的课程详情，现在将从localStorage加载和保存

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

function changeAccentColor(color = null) {
    if (!color) {
        const accentColor = localStorage.getItem('accentColor')
        if (!accentColor) {
            return
        }
        const colorPicker = document.querySelector('#color-picker');
        colorPicker.value = accentColor;
        sober.theme.createScheme(accentColor, { page: document.querySelector('s-page') });
    } else {
        localStorage.setItem('accentColor', color);
        sober.theme.createScheme(color, { page: document.querySelector('s-page') });
    }
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
    const panels = ['courses-panel', 'operation-panel', 'task-panel'];
    panels.forEach((id, index) => {
        const panel = document.getElementById(id);
        if (index === panelId) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });

    if (panelId === 1) {
        initializeSelectedCourseTable();
    }
}

function saveCoursesToLocalStorage() {
    localStorage.setItem('selectedCourses', JSON.stringify(globalCourses));
}

function initialize() {
    const cookieField = document.getElementById('cookie');
    if (localStorage.getItem('cookie')) {
        cookieField.value = localStorage.getItem('cookie');
    }

    // 从 localStorage 加载已选课程
    const storedCourses = localStorage.getItem('selectedCourses');
    if (storedCourses) {
        try {
            const parsedCourses = JSON.parse(storedCourses);
            if (Array.isArray(parsedCourses)) {
                globalCourses = parsedCourses;
            } else {
                console.warn("localStorage中selectedCourses数据格式不正确，已重置。");
                globalCourses = [];
            }
        } catch (e) {
            console.error("解析localStorage中的selectedCourses失败:", e);
            globalCourses = []; // 解析失败时重置
        }
    } else {
        globalCourses = []; // 没有数据，初始化为空数组
    }
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

    return fetch('/api/eas/courses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            count: 1,
            page: 1,
            session_id: cookie,
        })
    })
        .then(response => {
            if (response.ok) {
                return response.json().then(jsonResponse => {
                    globalLoggedIn = true;
                    localStorage.setItem('cookie', cookie);
                    showDialog('成功', '登录成功！', 'success');
                    return true;
                });
            } else {
                return response.json().then(errorData => {
                    const errorMessage = errorData.message || `服务器返回错误状态码: ${response.status}.`;
                    showDialog('错误', `登录失败：${errorMessage}`, 'error');
                    return false;
                }).catch(() => {
                    showDialog('错误', `登录失败：服务器返回状态码 ${response.status}`, 'error');
                    return false;
                });
            }
        })
        .catch(error => {
            showDialog('错误', `登录失败，请稍后重试或查看控制台\n${error.message || error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
            console.error('登录失败:', error);
            return false;
        })
        .finally(() => {
            saveBtn.disabled = false;
            loadingIndicator.classList.add('hidden');
        });
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

/**
 * 通过服务器获取更多课程
 * @param {number} page - 页码，默认为1
 * @param {number} size - 每页课程数量，默认为20
 * @param {boolean} positive - 是否为用户主动获取
 */
function fetchNewCourses(page = 1, size = 20, positive = true) {
    globalLoading.setAttribute('showed', 'true');

    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        globalLoading.setAttribute('showed', 'false');
        return Promise.resolve(false);
    }
    const cookie = localStorage.getItem('cookie');

    return fetch('/api/eas/courses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            count: size,
            page: page,
            session_id: cookie,
        })
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    const errorMessage = errorData.message || `服务器返回错误状态码: ${response.status}.`;
                    throw new Error(errorMessage);
                }).catch(() => {
                    throw new Error(`获取课程列表失败，服务器返回状态码: ${response.status}`);
                });
            }
        })
        .then(jsonResponse => {
            globalLoggedIn = true;
            localStorage.setItem('cookie', cookie);

            if (jsonResponse.error && jsonResponse.error !== "unexpected" && jsonResponse.error !== "ok") {
                showDialog('错误', jsonResponse.message || '获取课程列表失败，服务器返回错误信息。', 'error');
                return false;
            }

            return jsonResponse.data;
        })
        .catch(error => {
            globalLoggedIn = false;
            showDialog('错误', `获取课程列表失败，请稍后重试或查看控制台\n${error.message || error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
            console.error('获取课程失败:', error);
            return false;
        })
        .finally(() => {
            globalLoading.setAttribute('showed', 'false');
        });
}

function loadMoreCourses() {
    const currentPage = Number(globalCurrentPage.innerText);
    const newPage = currentPage + 1;

    fetchNewCourses(newPage, globalPageSize, true)
        .then(coursesData => {
            if (coursesData && Array.isArray(coursesData)) {
                coursesData.forEach(course => {
                    addLineToCourseTable(
                        course.name,
                        course.id,
                        course.teacher,
                        course.category,
                        course.selected,
                        course.limit
                    );
                });
                globalCurrentPage.innerText = newPage.toString();
                globalCurrentCount.innerText = (Number(globalCurrentCount.innerText) + coursesData.length).toString();
            } else {
                console.warn('未获取到新的课程数据或数据格式不正确。');
            }
        });
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
    const numSelected = Number(selected);
    const numLimit = Number(limit);

    if (isNaN(numLimit) || isNaN(numSelected) || numLimit === 0 || limit === "?" || selected === "?") {
        limit_linear.setAttribute('value', '100');
        limit_td.innerText = `${selected}/${limit}`;
    } else {
        limit_linear.setAttribute('value', String((numSelected / numLimit) * 100));
        limit_td.innerText = `${numSelected}/${numLimit}`;
    }
    limit_td.appendChild(limit_linear);

    operation_td.appendChild(add_btn);
    operation_td.appendChild(detail_btn);

    table_line.appendChild(document.createElement('s-td')).innerText = `${name} (${id})`;
    table_line.appendChild(document.createElement('s-td')).innerText = teacher;
    table_line.appendChild(document.createElement('s-td')).innerText = category;
    table_line.appendChild(limit_td);
    table_line.appendChild(operation_td);

    table_body.appendChild(table_line);
}

function fetchCourseDetail(classId, positive = true) {
    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return Promise.resolve(false);
    }

    return fetch("/api/eas/courses/" + classId + "/lessons", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: localStorage.getItem('cookie'),
        })
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(errorData => {
                    const errorMessage = errorData.message || `获取课程详情失败，服务器返回状态码: ${response.status}.`;
                    throw new Error(errorMessage);
                }).catch(() => {
                    throw new Error(`获取课程详情失败，服务器返回状态码: ${response.status}`);
                });
            }
        })
        .then(jsonResponse => {
            const courseDetail = jsonResponse.data;

            if (!courseDetail) {
                throw new Error('未找到课程详细信息。');
            }

            const name = courseDetail.name;
            const term = courseDetail.term;
            const week = courseDetail.week;
            const day = courseDetail.day;
            const content_type = courseDetail.content_type;
            const location_type = courseDetail.location_type;
            const location = courseDetail.location;
            const teachers = courseDetail.teachers;
            const sessions = courseDetail.sessions;

            const teacherStr = Array.isArray(teachers) ? teachers.join(', ') : teachers;
            const sessionStart = Array.isArray(sessions) && sessions.length > 0 ? Math.min(...sessions) : '?';
            const sessionEnd = Array.isArray(sessions) && sessions.length > 0 ? Math.max(...sessions) : '?';

            if (positive) {
                const message = `
课程名称: ${name}
授课学期: ${term}
授课周次: ${week} 周
授课星期: 星期${day}
授课内容类型: ${content_type}
授课地点: ${location} (${location_type})
授课教师: ${teacherStr}
授课节次: 第 ${sessionStart} 节 - 第 ${sessionEnd} 节
            `;
                showDialog('课程详情', message, 'info');
            } else {
                return {
                    id: classId,
                    name: name,
                    term: term,
                    week: week,
                    day: day,
                    content_type: content_type,
                    location_type: location_type,
                    location: location,
                    teacher: teacherStr,
                    sessions: {
                        start: sessionStart,
                        end: sessionEnd
                    }
                };
            }
        })
        .catch(error => {
            console.error('获取课程详情失败:', error);
            if (positive) {
                showDialog('错误', `获取课程详情失败，请稍后重试或查看控制台\n${error.message || error}`, 'error');
            }
            return false;
        });
}

function showCourseDetail(classId) {
    fetchCourseDetail(classId, true);
}

function addCourse(classId) {
    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return;
    }

    const existingCourse = globalCourses.find(course => course.id === classId);
    if (existingCourse) {
        showDialog('信息', `课程 ${existingCourse.name} (${classId}) 已经在列表中了。`, 'info');
        return;
    }

    fetchCourseDetail(classId, false)
        .then(courseData => {
            if (courseData) {
                globalCourses.push(courseData);
                saveCoursesToLocalStorage();
                showDialog('成功', `课程 ${courseData.name} (${classId}) 已成功添加到列表。`, 'success');
                if (document.getElementById('operation-panel').classList.contains('hidden') === false) {
                    initializeSelectedCourseTable();
                }
            } else {
                showDialog('错误', '无法获取课程详细信息，课程添加失败，请稍后重试或查看控制台。', 'error');
            }
        })
        .catch(error => {
            console.error('添加课程失败:', error);
            showDialog('错误', '添加课程时发生错误，请稍后重试或查看控制台。', 'error');
        });
}

function removeCourse(classId) {
    const originalLength = globalCourses.length;
    globalCourses = globalCourses.filter(course => course.id !== classId);
    if (globalCourses.length < originalLength) {
        saveCoursesToLocalStorage();
        showDialog('成功', `课程 (${classId}) 已从列表中移除。`, 'success');
        initializeSelectedCourseTable();
    } else {
        showDialog('错误', `课程 (${classId}) 未在列表中找到。`, 'error');
    }
}

function initializeSelectedCourseTable() {
    const table_body = document.getElementById('selected-table-body');
    const empty = document.getElementById('operation-panel-course-empty');
    table_body.innerHTML = '';
    empty.classList.add('hidden');

    if (globalCourses.length === 0) {
        empty.classList.remove('hidden');
    }

    globalCourses.forEach(course => {
        const table_line = document.createElement('s-tr');
        const name_td = document.createElement('s-td');
        const teacher_td = document.createElement('s-td');
        const class_time_td = document.createElement('s-td');
        const operation_td = document.createElement('s-td');
        const remove_btn = document.createElement('s-button');

        name_td.innerText = course.name + ' (' + course.id + ')';
        teacher_td.innerText = course.teacher;

        if (course.sessions && typeof course.sessions.start !== 'undefined' && typeof course.sessions.end !== 'undefined') {
            class_time_td.innerText = `星期 ${course.day} 第 ${course.sessions.start} 节 - 第 ${course.sessions.end} 节`;
        } else {
            class_time_td.innerText = `星期 ${course.day} 节次未知`;
        }

        remove_btn.innerText = '移除';
        remove_btn.setAttribute('classId', String(course.id));
        remove_btn.setAttribute('onclick', "removeCourse(this.getAttribute('classId'))");
        remove_btn.setAttribute('type', 'outlined');

        operation_td.appendChild(remove_btn);

        table_line.appendChild(name_td);
        table_line.appendChild(teacher_td);
        table_line.appendChild(class_time_td);
        table_line.appendChild(operation_td);

        table_body.appendChild(table_line);
    });

}

function addTask() {
    if (globalCourses.length === 0) {
        showDialog('错误', '课程列表为空，请先添加课程。', 'error');
        return;
    }
    if (!globalLoggedIn || !localStorage.getItem('cookie')) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return;
    }
    if (verifyTimeFormat(document.getElementById('task-start-time').value) === false) {
        showDialog('错误', '任务开始时间格式不正确，请按照 YYYY-MM-DD HH-mm-SS 的格式填写，例如 2025-09-01 12:00:00', 'error');
        return;
    }
    const cookie = localStorage.getItem('cookie');
    const courses = [];
    globalCourses.forEach(course => {
        courses.push(course.id);
    })
    const taskData = {
        account: {
            session_id: cookie,
        },
        config: {
            delay: "PT" + document.getElementById('task-delay').value + "S" || "PT0.5S",
            retry: document.getElementById('task-auto-retry-switch').checked,
            start_at: new Date(document.getElementById('task-start-time').value).toISOString() || new Date().toISOString(),
        },
        courses: courses,
    }

    fetch("/api/grabber", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
    }).then(response => {
        if (response.ok) {
            showDialog('成功', '抢课任务已添加，您可以在任务列表中查看任务。', 'success');
        } else {
            showDialog('错误', `抢课任务添加失败，服务器返回状态码: ${response.status}，请稍后重试或查看控制台。`, 'error');
        }
    }).catch(error => {
        console.error('添加抢课任务失败:', error);
        showDialog('错误', `添加抢课任务失败，请稍后重试或查看控制台\n${error.message || error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
    });
}

function getTasks() {
    fetch("/api/grabber/", {
        method: 'GET',
    }).then(response => {
        if (response.ok) {
            return response.json()
        } else {
            console.warn('获取任务列表失败，服务器返回状态码:', response.status);
            return false;
        }
    }).catch(error => {
        console.error('获取任务列表失败:', error);
        return false;
    })
}

function flushTaskTable() {
    getTasks().then(data => {
        if (!data) {
            return;
        }
        const table_body = document.getElementById('task-table-body');
        data.data.forEach(task => {
            const session_id = task.value.account.session_id;
            const courses = task.value.courses;
            const start_time = new Date(task.value.config.start_at).toLocaleString();
            const delay = task.value.config.delay;
            const retry = task.value.config.retry ? '开启' : '关闭';
            const status = task.status;

            const course_tags = document.createElement('s-td');
            courses.foreach(course => {
                const course_tag = document.createElement('s-chip');
                course_tag.innerText = course;
                course_tag.setAttribute('type', 'outlined');
                course_tag.setAttribute('classId', String(course));
                course_tag.setAttribute('onclick', "showCourseDetail(this.getAttribute('classId')); this.removeAttribute('checked');");
                course_tags.appendChild(course_tag);
            });

            const operation_td = document.createElement('s-td');
            const opeartion_btn = document.createElement('s-button');
            if (status === 'running') {
                opeartion_btn.innerText = '停止';
            } else {
                opeartion_btn.innerText = '启动';
                
            }
            const operation_remove_btn = document.createElement('s-button');
            operation_remove_btn.innerText = '移除';

            const table_line = document.createElement('s-tr');
            table_line.appendChild(document.createElement('s-td')).innerText = session_id;
            table_line.appendChild(course_tags);
            table_line.appendChild(document.createElement('s-td')).innerText = start_time;
            table_line.appendChild(document.createElement('s-td')).innerText = delay.replace('PT', '').replace('S', ' 秒');
            table_line.appendChild(document.createElement('s-td')).innerText = retry;
            table_line.appendChild(document.createElement('s-td')).innerText = status;

        })
    })
}

function syncSessionId() {
    const cookieField = document.getElementById('cookie');
    const sessionId = cookieField.value.trim();
    const taskSessionId = document.getElementById('task-sessionid');
    taskSessionId.value = sessionId;
}

function verifyTimeFormat(timeString) {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!regex.test(timeString)) {
        document.getElementById('task-start-time').setAttribute('error', 'true');
        return false;
    } else {
        document.getElementById('task-start-time').removeAttribute('error');
    }
    return true;
}