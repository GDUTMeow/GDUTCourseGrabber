// 全局DOM元素引用
let globalLoading = null;
let globalCurrentPage = null;
let globalCurrentCount = null;

// 全局配置
let globalPageSize = 20;
let globalLoggedIn = false;
let globalCourses = [];

let globalAutoRefreshTask = null;
let globalIndicatorInterval = null;
let currentIndicatorSteps = 0;
let totalIndicatorStepsForCycle = 0;

const WEEK_CN = { '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '日' };
const TASK_STATUS_MAP = { 0: "空闲/完成", 1: "等待开始", 2: "正在进行" };
let displayedCourseIdsInTable = new Set();
var gdutmoe_triggered = false;

// Cookie
const ACCENT_COLOR_COOKIE_NAME = 'accentColor';
const SELECTED_COURSES_COOKIE_NAME = 'selectedCourses';
const USER_SESSION_ID_COOKIE_NAME = 'userSessionId';

// 为了避免超过浏览器自身的Cookie长度限制，这里设置得比较小
const MAX_COOKIE_SIZE = 4000; // Maximum size for a single cookie in bytes


function toggleSidebar() {
    const menuBtn = document.getElementById('menu-btn');
    const faviconImgHtml = '<img src="favicon.png" height="32px" width="32px">';
    const leftArrowSvg = `<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"></path></svg>`;
    const rightArrowSvg = `<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"></path></svg>`;
    const trigger_msg = document.createElement('span');
    trigger_msg.innerHTML = `<div align="center"><img src="GDUTMoe.png" height="200px"></div><p>恭喜你发现了一个小彩蛋，左上角的图标已经换成了可爱的工娘了哦，工娘在这里给你问好 (*^▽^*)</p><p>左上角的图标已经换成了可爱的工娘了哦</p><p>工娘图来源：https://tieba.baidu.com/p/9023794849</p>`
    if (Math.random() < 0.1 && !gdutmoe_triggered) {
        menuBtn.innerHTML = faviconImgHtml;
        showDialog('恭喜', trigger_msg, 'success', true);
        gdutmoe_triggered = true;
    } else {
        if (!gdutmoe_triggered) {
            if (menuBtn.value === '1') {
                menuBtn.innerHTML = leftArrowSvg;
                menuBtn.value = '0';
            } else {
                menuBtn.innerHTML = rightArrowSvg;
                menuBtn.value = '1';
            }
        }
    }
    document.querySelector('s-drawer').toggle();
}

function openGithub() { window.open('https://github.com/GDUTMeow/GDUTCourseGrabber', '_blank'); }
function openGDUT() { window.open('https://www.gdut.edu.cn', '_blank'); }
function openGDUTJW() { window.open('https://jxfw.gdut.edu.cn/login!welcome.action', '_blank'); }

function changeAccentColor(color = null) {
    if (!color) {
        const accentColor = getCookie(ACCENT_COLOR_COOKIE_NAME);
        if (!accentColor) return;
        const colorPicker = document.querySelector('#color-picker');
        colorPicker.value = accentColor;
        sober.theme.createScheme(accentColor, { page: document.querySelector('s-page') });
    } else {
        setCookie(ACCENT_COLOR_COOKIE_NAME, color, 365);
        sober.theme.createScheme(color, { page: document.querySelector('s-page') });
    }
}

function showDialog(title, content, level, html = false) {
    const dialog = document.getElementById('dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogContent = document.getElementById('dialog-descr');
    if (level === 'error') dialogTitle.innerText = `🔴 ${title}`;
    else if (level === 'success') dialogTitle.innerText = `🟢 ${title}`;
    else dialogTitle.innerText = `🔵 ${title}`;
    if (html) {
        dialogContent.innerHTML = '';
        dialogContent.appendChild(content);
    } else {
        dialogContent.innerText = content;
    }
    dialog.setAttribute('showed', 'true');
}

function changePanel(panelId) {
    const panels = ['courses-panel', 'operation-panel', 'task-panel'];
    panels.forEach((id, index) => {
        const panel = document.getElementById(id);
        if (index === panelId) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
    });
    if (panelId === 1) initializeSelectedCourseTable();
    if (panelId === 2) flushTaskTable();
}

function saveCoursesToCookie() {
    result = setCookie(SELECTED_COURSES_COOKIE_NAME, globalCourses, 30);
    return result;
}

function initialize() {
    globalLoading = document.getElementById('global-loading');
    globalCurrentPage = document.getElementById('current-page');
    globalCurrentCount = document.getElementById('current-count');

    const cookieField = document.getElementById('cookie');
    const taskSessionIdField = document.getElementById('task-sessionid');
    const storedSessionId = getCookie(USER_SESSION_ID_COOKIE_NAME);
    if (storedSessionId) {
        cookieField.value = storedSessionId;
        taskSessionIdField.value = storedSessionId;
        saveAndLogin(false);
    }

    const storedCourses = getCookie(SELECTED_COURSES_COOKIE_NAME);
    if (storedCourses && Array.isArray(storedCourses)) {
        globalCourses = storedCourses;
    } else {
        if (storedCourses) console.warn(`Cookie "${SELECTED_COURSES_COOKIE_NAME}" data invalid.`);
        globalCourses = [];
        deleteCookie(SELECTED_COURSES_COOKIE_NAME);
    }
    changeAccentColor();
}

function saveAndLogin(positive = true) {
    const cookieField = document.getElementById('cookie');
    if (!cookieField.value) {
        showDialog('错误', '请先输入 JSESSIONID 再进行登录', 'error');
        return;
    }
    login(cookieField.value, positive);
    syncSessionId();
}

function login(cookieValue, positive = true) {
    const saveBtn = document.getElementById('save-config-btn');
    const loadingIndicator = document.getElementById('save-config-btn-loading');
    saveBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    return fetch(`/api/eas/courses?count=1&page=1&session_id=${cookieValue}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => {
            if (response.ok) {
                return response.json().then(jsonResponse => {
                    globalLoggedIn = true;
                    setCookie(USER_SESSION_ID_COOKIE_NAME, cookieValue, 7);
                    if (positive) showDialog('成功', '登录成功！', 'success');
                    document.getElementById('content-no-content-tip').classList.add('hidden');
                    document.getElementById('status').innerText = '🟢 已登录';
                    document.getElementById('content-table-body').innerHTML = '';
                    globalCurrentPage.innerText = '0';
                    globalCurrentCount.innerText = '0';
                    flushCoursesTable();
                    return true;
                });
            } else {
                return response.json().then(errorData => {
                    const errorMessage = errorData.message || `服务器返回错误状态码: ${response.status}.`;
                    document.getElementById('status').innerText = '🔴 登录出错，请尝试更新 JSESSIONID';
                    if (positive) showDialog('错误', `登录失败：${errorMessage}`, 'error');
                    return false;
                }).catch(() => {
                    document.getElementById('status').innerText = '🔴 登录出错，请尝试更新 JSESSIONID';
                    if (positive) showDialog('错误', `登录失败：服务器返回状态码 ${response.status}`, 'error');
                    return false;
                });
            }
        })
        .catch(error => {
            document.getElementById('status').innerText = '🔴 登录出错';
            if (positive) showDialog('错误', `登录失败，请稍后重试或查看控制台\n${error.message || error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
            console.error('登录失败:', error);
            return false;
        })
        .finally(() => {
            saveBtn.disabled = false;
            loadingIndicator.classList.add('hidden');
        });
}

function flushCoursesTable() {
    document.getElementById('content-table-body').innerHTML = '';
    globalCurrentPage.innerText = '0';
    globalCurrentCount.innerText = '0';
    displayedCourseIdsInTable.clear();
    loadMoreCourses();
}

function onChangePageSize(size, custom = false) {
    if (!custom) {
        document.getElementById('custom-page-size-input').classList.add('hidden');
        document.getElementById('custom-page-size-btn').classList.add('hidden');
    }
    globalPageSize = Number(size);
    flushCoursesTable();
}

function onCustomPageSizeChecked() {
    document.getElementById('custom-page-size-input').classList.remove('hidden');
    document.getElementById('custom-page-size-input').value = "";
    document.getElementById('custom-page-size-btn').classList.remove('hidden');
}

function fetchNewCourses(page = 1, size = 20, positive = true) {
    globalLoading.setAttribute('showed', 'true');
    const userSession = getCookie(USER_SESSION_ID_COOKIE_NAME);
    if (!globalLoggedIn || !userSession) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        globalLoading.setAttribute('showed', 'false');
        return Promise.resolve(false);
    }

    return fetch(`/api/eas/courses?count=${size}&page=${page}&session_id=${userSession}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => {
            if (response.ok) return response.json();
            return response.json().then(errorData => {
                throw new Error(errorData.message || `服务器返回错误状态码: ${response.status}.`);
            }).catch(() => {
                throw new Error(`获取课程列表失败，服务器返回状态码: ${response.status}`);
            });
        })
        .then(jsonResponse => {
            if (jsonResponse.error && jsonResponse.error !== "ok" && jsonResponse.error !== "unexpected") {
                if (jsonResponse.message) showDialog('提示', jsonResponse.message, 'info');
                else showDialog('错误', '获取课程列表时服务器返回未知错误。', 'error');
                return (jsonResponse.data && Array.isArray(jsonResponse.data)) ? jsonResponse.data : [];
            }
            return jsonResponse.data || [];
        })
        .catch(error => {
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
    fetchNewCourses(newPage, globalPageSize, true).then(coursesData => {
        if (coursesData && Array.isArray(coursesData)) {
            let newCoursesAddedCount = 0;
            coursesData.forEach(course => {
                if (course && typeof course.id !== 'undefined') {
                    const courseIdStr = String(course.id);
                    if (!displayedCourseIdsInTable.has(courseIdStr)) {
                        addLineToCourseTable(decodeHtmlEntities(course.name), course.id, course.teacher, course.category, course.chosen, course.limit, course.source, course.note);
                        displayedCourseIdsInTable.add(courseIdStr);
                        newCoursesAddedCount++;
                    }
                } else {
                    console.warn("Encountered a course with missing ID or invalid course object:", course);
                }
            });
            if (newCoursesAddedCount > 0) {
                globalCurrentPage.innerText = newPage.toString();
                globalCurrentCount.innerText = (Number(globalCurrentCount.innerText) + newCoursesAddedCount).toString();
            } else if (newPage > 1) {
                showDialog('提示', '课程列表已经加载完啦，下面已经没有更多课程了', 'info');
            }
        } else if (coursesData === false) { /* Error already handled by fetchNewCourses */ }
    });
}

function addLineToCourseTable(name, id, teacher, category, chosen, limit, source = 0, note = "") {
    const table_body = document.getElementById('content-table-body');
    const table_line = document.createElement('s-tr');
    const operation_td = document.createElement('s-td');
    const add_btn = document.createElement('s-button');
    const detail_btn = document.createElement('s-button');
    add_btn.innerText = '添加到列表';
    add_btn.setAttribute('type', 'outlined');
    add_btn.setAttribute('classId', String(id));
    const courseRawData = { name, teacher, category: category || "", chosen, limit, source, note: note || "" };
    add_btn.dataset.courseRaw = JSON.stringify(courseRawData);
    add_btn.setAttribute('onclick', `addCourse(this.getAttribute('classId'), JSON.parse(this.dataset.courseRaw))`);
    add_btn.style.marginRight = '8px';
    detail_btn.innerText = '查看详情';
    detail_btn.setAttribute('classId', String(id));
    detail_btn.setAttribute('onclick', "showCourseDetail(this.getAttribute('classId'))");
    const limit_td = document.createElement('s-td');
    const limit_linear = document.createElement('s-linear-progress');
    const numSelected = Number(chosen);
    const numLimit = Number(limit);
    if (isNaN(numLimit) || isNaN(numSelected) || numLimit === 0 || limit === "?" || chosen === "?") {
        limit_linear.setAttribute('value', '0');
        limit_td.innerText = `${chosen || '?'}/${limit || '?'}`;
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

function formatWeeksArrayToDisplayString(weeks) {
    if (!weeks || !Array.isArray(weeks) || weeks.length === 0) return "未知";
    const sortedWeeks = [...new Set(weeks)].sort((a, b) => a - b);
    let weekStr = "";
    if (sortedWeeks.length > 0) {
        let startRange = sortedWeeks[0];
        for (let i = 0; i < sortedWeeks.length; i++) {
            if (!(i + 1 < sortedWeeks.length && sortedWeeks[i + 1] === sortedWeeks[i] + 1)) {
                if (weekStr) weekStr += ", ";
                if (startRange === sortedWeeks[i]) weekStr += startRange;
                else weekStr += `${startRange}-${sortedWeeks[i]}`;
                if (i + 1 < sortedWeeks.length) startRange = sortedWeeks[i + 1];
            }
        }
    }
    return weekStr || "未知";
}

function fetchCourseDetail(classId, positive = true) {
    const userSession = getCookie(USER_SESSION_ID_COOKIE_NAME);
    if (!globalLoggedIn || !userSession) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return Promise.resolve(false);
    }
    globalLoading.setAttribute('showed', 'true');
    return fetch(`/api/eas/courses/${classId}/lessons?session_id=${userSession}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => {
            if (response.ok) return response.json();
            return response.json().then(errorData => {
                throw new Error(errorData.message || `获取课程详情失败，服务器返回状态码: ${response.status}.`);
            }).catch(() => {
                throw new Error(`获取课程详情失败，服务器返回状态码: ${response.status}`);
            });
        })
        .then(jsonResponse => {
            const courseLessons = jsonResponse.data;
            if (jsonResponse.error && jsonResponse.error !== "ok" && jsonResponse.error !== "unexpected") {
                throw new Error(jsonResponse.message || '获取课程详情时服务器返回错误。');
            }
            if (!Array.isArray(courseLessons) || courseLessons.length === 0) {
                if (!positive) {
                    return { term: "未知", weeks: [], day: null, content_type: "未知", location_type: "未知", location: "未指定", sessions: { start: '?', end: '?' } };
                } else {
                    throw new Error('未找到课程详细信息或课程无授课安排。');
                }
            }
            const firstLesson = courseLessons[0];
            const nameFromDetail = firstLesson.name;
            const term = firstLesson.term;
            const day = firstLesson.day;
            const content_type = firstLesson.content_type;
            const location_type = firstLesson.location_type;
            const location = firstLesson.location;
            const teachers = firstLesson.teachers;
            const sessions = firstLesson.sessions;
            const weeksArray = courseLessons.map(lesson => lesson.week).filter(week => typeof week === 'number');
            const teacherStr = Array.isArray(teachers) ? teachers.join(', ') : (teachers || "未知教师");
            const sessionStart = Array.isArray(sessions) && sessions.length > 0 ? Math.min(...sessions) : '?';
            const sessionEnd = Array.isArray(sessions) && sessions.length > 0 ? Math.max(...sessions) : '?';
            if (positive) {
                const weekStrDisplay = formatWeeksArrayToDisplayString(weeksArray);
                const content = document.createElement("ul");
                content.appendChild(document.createElement("li")).innerText = `课程教学班: ${nameFromDetail}`;
                content.appendChild(document.createElement("li")).innerText = `授课学期: ${term || '未知'}`;
                content.appendChild(document.createElement("li")).innerText = `授课周次: 第 ${weekStrDisplay} 周`;
                content.appendChild(document.createElement("li")).innerText = `授课星期: 每周${WEEK_CN[day.toString()] || '?'}`;
                content.appendChild(document.createElement("li")).innerText = `授课内容类型: ${content_type || '未知'}`;
                content.appendChild(document.createElement("li")).innerText = `授课地点: ${location || '未指定'} (${location_type || '未知'})`;
                content.appendChild(document.createElement("li")).innerText = `授课教师: ${teacherStr}`;
                content.appendChild(document.createElement("li")).innerText = `授课节次: 第 ${sessionStart} - ${sessionEnd} 节`;
                showDialog('课程详情', content, 'info', true);
                return true;
            } else {
                return { term, weeks: weeksArray, day, content_type, location_type, location, sessions: { start: sessionStart, end: sessionEnd }, nameFromDetail, teacherFromDetail: teacherStr };
            }
        })
        .catch(error => {
            console.error(`获取课程 ${classId} 详情失败:`, error);
            if (positive) showDialog('错误', `获取课程详情失败，请稍后重试或查看控制台\n${error.message || error}`, 'error');
            return false;
        })
        .finally(() => {
            globalLoading.setAttribute('showed', 'false');
        });
}

function showCourseDetail(classId) {
    fetchCourseDetail(classId, true);
}

function addCourse(classId, courseRawData) {
    const userSession = getCookie(USER_SESSION_ID_COOKIE_NAME);
    if (!globalLoggedIn || !userSession) {
        showDialog('错误', '请先登录后再进行操作', 'error');
        return;
    }
    const classIdStr = String(classId);
    if (globalCourses.find(course => String(course.id) === classIdStr)) {
        showDialog('信息', `课程 「${courseRawData.name || classIdStr} (${classIdStr})」 已经在列表中了。`, 'info');
        return;
    }
    globalLoading.setAttribute('showed', 'true');
    fetchCourseDetail(classIdStr, false).then(lessonDetails => {
        globalLoading.setAttribute('showed', 'false');
        if (lessonDetails === false) {
            showDialog('错误', `无法添加课程 「${courseRawData.name || classIdStr}」，获取上课安排失败`, 'error');
            return;
        }
        const safeLessonDetails = (typeof lessonDetails === 'object' && lessonDetails !== null) ? lessonDetails : { term: "未知", weeks: [], day: null, content_type: "未知", location_type: "未知", location: "未指定", sessions: { start: '?', end: '?' } };
        const courseToAdd = {
            id: classIdStr, name: String(courseRawData.name || "未知课程"), teacher: String(courseRawData.teacher || "未知教师"),
            category: String(courseRawData.category || ""), chosen: courseRawData.chosen !== undefined ? Number(courseRawData.chosen) : 0,
            limit: courseRawData.limit !== undefined ? Number(courseRawData.limit) : 0, source: courseRawData.source !== undefined ? Number(courseRawData.source) : 0,
            note: String(courseRawData.note || ""), term: safeLessonDetails.term, weeks: safeLessonDetails.weeks, day: safeLessonDetails.day,
            content_type: safeLessonDetails.content_type, location_type: safeLessonDetails.location_type, location: safeLessonDetails.location, sessions: safeLessonDetails.sessions,
        };
        globalCourses.push(courseToAdd);
        result = saveCoursesToCookie();
        if (!result) {
            showDialog('错误', `无法保存课程「${courseRawData.name || classIdStr}」，因为当前课程列表过大，请尝试移除一些不必要的课程。`, 'error');
            return;
        }
        showDialog('成功', `课程 「${courseRawData.name} (${classIdStr})」 已成功添加到列表。`, 'success');
        if (!document.getElementById('operation-panel').classList.contains('hidden')) {
            initializeSelectedCourseTable();
        }
    }).catch(error => {
        globalLoading.setAttribute('showed', 'false');
        console.error(`添加课程 「${courseRawData.name || classIdStr}」 过程出错:`, error);
        showDialog('错误', `添加课程 「${courseRawData.name || classIdStr}」 时发生错误，请查看控制台。`, 'error');
    });
}

function removeCourse(classId) {
    const classIdStr = String(classId);
    const courseToRemove = globalCourses.find(course => String(course.id) === classIdStr);
    const originalLength = globalCourses.length;
    globalCourses = globalCourses.filter(course => String(course.id) !== classIdStr);
    if (globalCourses.length < originalLength) {
        saveCoursesToCookie();
        showDialog('成功', `课程 「${courseToRemove ? courseToRemove.name : ''} (${classIdStr})」 已从列表中移除。`, 'success');
        initializeSelectedCourseTable();
    } else {
        showDialog('信息', `课程 「(${classIdStr})」 未在列表中找到。`, 'info');
    }
}

function initializeSelectedCourseTable() {
    const table_body = document.getElementById('selected-table-body');
    const empty_message = document.getElementById('operation-panel-course-empty');
    table_body.innerHTML = '';
    if (!globalCourses || globalCourses.length === 0) {
        empty_message.classList.remove('hidden');
        document.getElementById('selected-courses-count').innerText = '0';
        return;
    }
    empty_message.classList.add('hidden');
    globalCourses.forEach((course, index) => {
        const table_line = document.createElement('s-tr');
        const name_td = document.createElement('s-td');
        const teacher_td = document.createElement('s-td');
        const class_time_td = document.createElement('s-td');
        const operation_td = document.createElement('s-td');
        const pin_top_btn = document.createElement('s-button');

        const move_up_btn = document.createElement('s-button');
        move_up_btn.setAttribute("type", "elevated");

        const detail_btn = document.createElement('s-button');
        detail_btn.setAttribute("type", "filled-tonal");

        const remove_btn = document.createElement('s-button');
        remove_btn.setAttribute("type", "outlined");

        name_td.innerText = `${course.name || '未知课程'} (${course.id})`;
        name_td.style.alignContent = "center";

        teacher_td.innerText = course.teacher || '未知教师';
        teacher_td.style.alignContent = "center"

        const weeksDisplay = formatWeeksArrayToDisplayString(course.weeks);
        let dayDisplay = course.day ? `每周${WEEK_CN[String(course.day)] || '?'}` : "每周？";
        let sessionDisplay = (course.sessions && typeof course.sessions.start !== 'undefined' && typeof course.sessions.end !== 'undefined') ? `第 ${course.sessions.start} - ${course.sessions.end} 节` : "节次未知";
        class_time_td.innerText = `第 ${weeksDisplay} 周，${dayDisplay}，${sessionDisplay}`;
        class_time_td.style.alignContent = "center"

        pin_top_btn.innerText = '置顶';
        pin_top_btn.setAttribute('classId', String(course.id));
        pin_top_btn.setAttribute('onclick', `pinCourseToTopInList('${String(course.id)}')`);
        pin_top_btn.style.marginRight = '8px';
        if (index === 0) pin_top_btn.setAttribute('disabled', 'true');

        move_up_btn.innerText = '上移';
        move_up_btn.setAttribute('classId', String(course.id));
        move_up_btn.setAttribute('onclick', `moveCourseUpInList('${String(course.id)}')`);
        if (index === 0) move_up_btn.setAttribute('disabled', 'true');

        detail_btn.innerText = '详情';
        detail_btn.setAttribute('classId', String(course.id));
        detail_btn.setAttribute('onclick', `showCourseDetail('${String(course.id)}')`);
        detail_btn.style.marginRight = '8px';

        remove_btn.innerText = '移除';
        remove_btn.setAttribute('classId', String(course.id));
        remove_btn.setAttribute('onclick', `removeCourse('${String(course.id)}')`);

        const first_line_container = document.createElement("div");
        first_line_container.style.marginBottom = "8px";
        first_line_container.appendChild(pin_top_btn);
        first_line_container.appendChild(move_up_btn);

        const second_line_container = document.createElement("div");
        second_line_container.appendChild(detail_btn);
        second_line_container.appendChild(remove_btn);

        operation_td.appendChild(first_line_container);
        operation_td.appendChild(second_line_container);

        table_line.appendChild(name_td);
        table_line.appendChild(teacher_td);
        table_line.appendChild(class_time_td);
        table_line.appendChild(operation_td);
        table_body.appendChild(table_line);
    });
    document.getElementById('selected-courses-count').innerText = globalCourses.length.toString();
}

function addTask() {
    if (globalCourses.length === 0) {
        showDialog('错误', '课程列表为空，请先添加课程。', 'error'); return;
    }
    const userSession = getCookie(USER_SESSION_ID_COOKIE_NAME);
    if (!globalLoggedIn || !userSession) {
        showDialog('错误', '请先登录后再进行操作', 'error'); return;
    }
    const startTimeValue = document.getElementById('task-start-time').value.trim();
    if (startTimeValue && verifyTimeFormat(startTimeValue) === false) {
        showDialog('错误', '任务开始时间格式不正确，请按照 YYYY-MM-DD HH:mm:SS 的格式填写，例如 2025-09-01 12:00:00', 'error'); return;
    }
    const coursesForPayload = globalCourses.map(course => ({
        id: Number(course.id), name: String(course.name || ""), teacher: String(course.teacher || ""),
        category: String(course.category || ""), chosen: Number(course.chosen) || 0,
        limit: Number(course.limit) || 0, source: Number(course.source) || 0, note: String(course.note || "")
    }));
    const taskData = {
        account: { session_id: userSession },
        config: {
            delay: "PT" + (document.getElementById('task-delay').value || "0.5") + "S",
            retry: document.getElementById('task-auto-retry-switch').checked,
            start_at: startTimeValue ? new Date(startTimeValue).toISOString() : new Date().toISOString(),
        },
        courses: coursesForPayload,
    };
    globalLoading.setAttribute('showed', 'true');
    fetch("/api/grabber", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    }).then(response => {
        if (response.ok) {
            return response.json().then(data => {
                let taskIdMessage = '';
                if (data && data.data && data.data.task_id) taskIdMessage = ` (ID: ${data.data.task_id})`;
                else if (data && data.task_id) taskIdMessage = ` (ID: ${data.task_id})`;
                showDialog('成功', `抢课任务已添加${taskIdMessage}，您可以在任务列表中查看任务。`, 'success');
                flushTaskTable();
            });
        } else {
            return response.json().then(err => {
                showDialog('错误', `抢课任务添加失败: ${err.message || response.statusText}`, 'error');
            }).catch(() => {
                showDialog('错误', `抢课任务添加失败，服务器返回状态码: ${response.status}，请稍后重试或查看控制台。`, 'error');
            });
        }
    }).catch(error => {
        console.error('添加抢课任务失败:', error);
        showDialog('错误', `添加抢课任务失败，请稍后重试或查看控制台\n${error.message || error}\n如果出现了严重的错误，可以考虑开个 issue: https://github.com/GDUTMeow/GDUTCourseGrabber/issues/new`, 'error');
    }).finally(() => {
        globalLoading.setAttribute('showed', 'false');
        flushTaskTable();
    });
}

async function getTasks() {
    try {
        const response = await fetch("/api/grabber/", { method: 'GET' });
        if (response.ok) return await response.json();
        const err = await response.json().catch(() => ({ message: response.statusText }));
        showDialog('错误', `获取任务列表失败: ${err.message || response.statusText}`, 'error');
        return null;
    } catch (error) {
        showDialog('错误', `获取任务列表失败: ${error.message}`, 'error');
        return null;
    }
}

async function getTaskStatus(taskId) {
    try {
        const response = await fetch(`/api/grabber/${taskId}/status`, { method: 'GET' });
        if (response.ok) return (await response.json()).data;
        return null;
    } catch (error) { return null; }
}

async function flushTaskTable() {
    const tasksData = await getTasks();
    const table_body = document.getElementById('task-table-body');
    const empty_message = document.getElementById('task-empty-tip');
    table_body.innerHTML = '';
    if (!tasksData || !tasksData.data || tasksData.data.length === 0) {
        if (empty_message) empty_message.classList.remove('hidden');
        return;
    }
    if (empty_message) empty_message.classList.add('hidden');
    globalLoading.setAttribute('showed', 'true');
    for (const task of tasksData.data) {
        const taskId = task.key;
        const session_id = task.value.account.session_id;
        const coursesInTask = task.value.courses;
        const start_time = new Date(task.value.config.start_at).toLocaleString();
        const delay = task.value.config.delay;
        const retry = task.value.config.retry ? '开启' : '关闭';
        let statusValue = await getTaskStatus(taskId);
        let statusText = TASK_STATUS_MAP[statusValue] || "未知";
        const course_tags_td = document.createElement('s-td');
        course_tags_td.style.alignContent = 'center';
        if (Array.isArray(coursesInTask)) {
            coursesInTask.forEach(courseObj => {
                const course_tag = document.createElement('s-chip');
                let displayInfo = '未知课程', actualId = null;
                if (typeof courseObj === 'object' && courseObj !== null && typeof courseObj.id !== 'undefined') {
                    actualId = String(courseObj.id);
                    displayInfo = `${courseObj.name || '未知名称'} (${actualId})`;
                }
                course_tag.innerText = displayInfo;
                course_tag.setAttribute('type', 'outlined');
                if (actualId) {
                    course_tag.setAttribute('classId', actualId);
                    course_tag.setAttribute('onclick', "showCourseDetail(this.getAttribute('classId')); setTimeout(() => this.removeAttribute('checked'), 0);");
                }
                course_tags_td.appendChild(course_tag);
                course_tags_td.appendChild(document.createElement('br'));
            });
        }
        const operation_td = document.createElement('s-td');
        operation_td.style.alignContent = 'center';
        const toggle_btn = document.createElement('s-button');
        if (statusValue === 1 || statusValue === 2) {
            toggle_btn.innerText = '停止';
            toggle_btn.setAttribute('onclick', `stopTask('${taskId}')`);
        } else if (statusValue === 0) {
            toggle_btn.innerText = '启动';
            toggle_btn.setAttribute('onclick', `startTask('${taskId}')`);
        }
        toggle_btn.style.marginRight = '8px';
        const remove_task_btn = document.createElement('s-button');
        remove_task_btn.innerText = '移除';
        remove_task_btn.setAttribute('taskId', String(taskId));
        remove_task_btn.setAttribute('onclick', "removeTask(this.getAttribute('taskId'))");
        remove_task_btn.setAttribute('type', 'outlined');
        operation_td.appendChild(toggle_btn);
        operation_td.appendChild(remove_task_btn);
        const table_line = document.createElement('s-tr');
        table_line.appendChild(document.createElement('s-td')).innerText = taskId;
        table_line.appendChild(document.createElement('s-td')).innerText = session_id;
        table_line.appendChild(course_tags_td);
        table_line.appendChild(document.createElement('s-td')).innerText = start_time;
        const delay_td_content = document.createElement('s-td');
        delay_td_content.innerText = delay.replace('PT', '').replace('S', ' 秒');
        table_line.appendChild(delay_td_content);
        table_line.appendChild(document.createElement('s-td')).innerText = retry;
        table_line.appendChild(document.createElement('s-td')).innerText = statusText;
        table_line.appendChild(operation_td);
        table_body.appendChild(table_line);
    }
    globalLoading.setAttribute('showed', 'false');
}

async function startTask(taskId) {
    globalLoading.setAttribute('showed', 'true');
    fetch(`/api/grabber/${taskId}/start`, { method: 'GET' }).then(response => {
        if (response.ok) showDialog('成功', `任务 ${taskId} 已启动。`, 'success');
        else showDialog('错误', `启动任务 ${taskId} 失败: ${response.statusText}`, 'error');
    }).catch(error => showDialog('错误', `启动任务 ${taskId} 失败: ${error.message}`, 'error')
    ).finally(() => { flushTaskTable(); globalLoading.setAttribute('showed', 'false'); });
}

async function stopTask(taskId) {
    globalLoading.setAttribute('showed', 'true');
    fetch(`/api/grabber/${taskId}/cancel`, { method: 'GET' }).then(response => {
        if (response.ok) showDialog('成功', `任务 ${taskId} 已停止。`, 'success');
        else showDialog('错误', `停止任务 ${taskId} 失败: ${response.statusText}`, 'error');
    }).finally(() => { flushTaskTable(); globalLoading.setAttribute('showed', 'false'); });
}

function syncSessionId() {
    const cookieField = document.getElementById('cookie');
    const sessionId = cookieField.value.trim();
    const taskSessionIdField = document.getElementById('task-sessionid');
    if (taskSessionIdField) taskSessionIdField.value = sessionId;
}

function verifyTimeFormat(timeString) {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    const field = document.getElementById('task-start-time');
    if (!regex.test(timeString.trim())) {
        field.setAttribute('error', 'true'); return false;
    }
    field.removeAttribute('error');
    return true;
}

async function removeTask(taskId) {
    globalLoading.setAttribute('showed', 'true');
    try {
        const response = await fetch(`/api/grabber/${taskId}`, { method: 'DELETE' });
        if (response.ok) showDialog('成功', `任务 ${taskId} 已成功移除。`, 'success');
        else {
            const err = await response.json().catch(() => ({ message: response.statusText }));
            showDialog('错误', `移除任务 ${taskId} 失败: ${err.message || response.statusText}`, 'error');
        }
    } catch (error) { showDialog('错误', `移除任务 ${taskId} 失败: ${error.message}`, 'error'); }
    finally { await flushTaskTable(); globalLoading.setAttribute('showed', 'false'); }
}

function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function toggleAutoRefreshTaskTable() {
    const delayInput = document.getElementById('task-table-auto-refresh-delay');
    const delay = Number(delayInput.value);
    const refreshIndicator = document.getElementById('task-table-auto-refresh-indicator');
    const loadingIndicator = document.getElementById('task-table-auto-refresh-animation');
    if (globalAutoRefreshTask) {
        clearInterval(globalAutoRefreshTask); globalAutoRefreshTask = null;
        if (globalIndicatorInterval) { clearInterval(globalIndicatorInterval); globalIndicatorInterval = null; }
        refreshIndicator.classList.add('hidden'); loadingIndicator.classList.add('hidden');
        refreshIndicator.value = 0; currentIndicatorSteps = 0;
    } else {
        if (isNaN(delay) || delay < 1) {
            showDialog('错误', "刷新时间必须是大于等于 1 的数字！", 'error'); delayInput.focus(); return;
        }
        refreshIndicator.classList.remove('hidden'); loadingIndicator.classList.remove('hidden');
        refreshIndicator.max = 100; refreshIndicator.value = 0;
        currentIndicatorSteps = 0; totalIndicatorStepsForCycle = delay * 10;
        globalIndicatorInterval = setInterval(() => {
            currentIndicatorSteps++;
            let percentage = (currentIndicatorSteps / totalIndicatorStepsForCycle) * 100;
            if (percentage > 100) percentage = 100;
            refreshIndicator.value = percentage;
        }, 100);
        globalAutoRefreshTask = setInterval(() => {
            flushTaskTable(); currentIndicatorSteps = 0; refreshIndicator.value = 0;
        }, delay * 1000);
    }
}

function moveCourseUpInList(courseId) {
    const idToMove = String(courseId);
    if (!Array.isArray(globalCourses)) return;
    const index = globalCourses.findIndex(course => String(course.id) === idToMove);
    if (index > 0) {
        [globalCourses[index - 1], globalCourses[index]] = [globalCourses[index], globalCourses[index - 1]];
        saveCoursesToCookie();
        if (typeof initializeSelectedCourseTable === 'function') initializeSelectedCourseTable();
    }
}

function pinCourseToTopInList(courseId) {
    const idToPin = String(courseId);
    if (!Array.isArray(globalCourses)) return;
    const index = globalCourses.findIndex(course => String(course.id) === idToPin);
    if (index > 0) {
        const [courseToPin] = globalCourses.splice(index, 1);
        globalCourses.unshift(courseToPin);
        saveCoursesToCookie();
        if (typeof initializeSelectedCourseTable === 'function') initializeSelectedCourseTable();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initialize();
    const cookieInput = document.getElementById('cookie');
    if (cookieInput) cookieInput.addEventListener('input', syncSessionId);

    globalLoading = document.getElementById('global-loading');
    globalCurrentPage = document.getElementById('current-page');
    globalCurrentCount = document.getElementById('current-count');
});

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    const valueToStore = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : value;
    byteLength = new TextEncoder().encode(valueToStore).length;
    console.log(byteLength);
    if (byteLength > MAX_COOKIE_SIZE) {
        console.warn(`Cookie "${name}" has reached maximum size limit (${MAX_COOKIE_SIZE} bytes). Cannot store value.`);
        showDialog('错误', '选择的课程过多，请先移除不必要的课程后再添加！', 'error');
        return false;
    }
    document.cookie = name + "=" + (valueToStore || "") + expires + "; path=/; SameSite=Lax";
    return true;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
            try {
                if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                    return JSON.parse(value);
                }
            } catch (e) { 
                console.error(`解析 Cookie "${name}" 时出错:`, e);
            }
            return value;
        }
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/;';
}