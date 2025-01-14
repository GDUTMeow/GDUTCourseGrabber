const showDialog = (title, msg) => {
    const dialog = document.querySelector("#dialog");
    const dialogTitle = document.querySelector("#dialog .dialog-title");
    const dialogBody = document.querySelector("#dialog .dialog-content");
    dialogTitle.textContent = title;
    dialogBody.innerHTML = msg;
    dialog.showModal();
};

const showConfirmDialog = (title, msg) => {
    const dialog = document.querySelector("#confirm-dialog");
    const dialogTitle = document.querySelector("#confirm-dialog .dialog-title");
    const dialogBody = document.querySelector("#confirm-dialog .dialog-content");
    const yes = document.querySelector("#confirm-dialog-yes");
    const no = document.querySelector("#confirm-dialog-no");
    const promise = new Promise((res) => {
        const yesCallback = () => {
            res(true);
            clearCallback();
        };
        const noCallback = () => {
            res(false);
            clearCallback();
        };
        const clearCallback = () => {
            console.log("clear callback");
            yes.removeEventListener("click", yesCallback);
            no.removeEventListener("click", noCallback);
            dialog.close();
        };
        yes.addEventListener("click", yesCallback);
        no.addEventListener("click", noCallback);
    });

    dialogTitle.textContent = title;
    dialogBody.textContent = msg;
    dialog.showModal();
    return promise;
};

// 添加分页相关的全局变量
let currentPage = 1;
let pageSize = 10;
let allCourses = [];
let session_id = localStorage.getItem("session_id") || "";
const API_BASE_URL = "/api";
let tasks = [];

document.addEventListener("DOMContentLoaded", function () {
    document
        .getElementById("fetch-courses-btn")
        .addEventListener("click", fetchCourses);
    document.getElementById("start-qk-btn").addEventListener("click", start);
    document.getElementById("stop-qk-btn").addEventListener("click", stop);

    checkCoursesCount();
    document.getElementById("cookie").value = session_id;
    document.getElementById("cookie").addEventListener("change", function () {
        session_id = this.value;
        localStorage.setItem("session_id", session_id);
    });

    // 添加分页控件的事件监听
    document.getElementById("prev-page").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayCurrentPage();
            updatePagination();
        }
    });

    document.getElementById("next-page").addEventListener("click", () => {
        const totalPages = Math.ceil(allCourses.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            displayCurrentPage();
            updatePagination();
        }
    });

    document.getElementById("page-size").addEventListener("change", (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1; // 重置到第一页
        displayCurrentPage();
        updatePagination();
    });
    loadConfigCourses();
    document
        .getElementById("save-config-btn")
        .addEventListener("click", saveGrabCourseConfig);
        updateButtonStatus();
         fetchTasks();
});

function addCourseEntry() {
    const configTableBody = document.querySelector(
        "#config-dialog #config-table tbody"
    );
    const courseEntry = document.createElement("tr");
    courseEntry.innerHTML = `
       <td>
       <input type="text" placeholder="课程名称(代码)" >
        </td>
         <td>
           <input type="text" placeholder="老师名字">
            </td>
               <td>
               <input type="text" placeholder="备注">
                 </td>
           <td>
                 <button type="button" class="btn remove-course" onclick="this.parentElement.parentElement.remove()">-</button>
           </td>
    `;
    configTableBody.appendChild(courseEntry);
    checkCoursesCount();
}

function checkCoursesCount() {
    const configTableBody = document.querySelector(
        "#config-dialog #config-table tbody"
    );
    const courseEntries = configTableBody.querySelectorAll("tr");
    const removeButtons = configTableBody.querySelectorAll(".remove-course");

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

async function fetchCourses() {
    const cookie = document.getElementById("cookie").value;
    if (!cookie) {
        showDialog("提示", "请先输入 JSESSIONID");
        return;
    }

    const tableBody = document.getElementById("available-courses-list");
    tableBody.innerHTML = '<tr><td colspan="6">加载中...</td></tr>';
    try {
        const response = await fetch(
            `${API_BASE_URL}/eas/courses?session_id=${session_id}&count=${pageSize}&page=${currentPage}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            tableBody.innerHTML = `<tr><td colspan="6">错误: ${data.error} - ${data.message}</td></tr>`;
            return;
        }
        updateAvailableCourses(data.data);
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6">获取课程列表失败: ${error.message}</td></tr>`;
    }
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
            <td>${course.id}</td>
            <td>${course.name} </td>
             <td>${course.category}</td>
            <td>${course.teacher}</td>
            <td>-</td>
            <td>
                <input type="hidden" name="kcrwdm" value="${course.id}">
                <input type="hidden" name="kcmc" value="${course.name}">
                <input type="hidden" name="teacher" value="${course.teacher || "未知"
            }">
                <input type="hidden" name="preset" value="true">
                <input type="hidden" name="remark" value="${course.note || ""}">
                <button type="submit" class="btn" onclick="addCourse(${course.id
            })">添加</button>
                <button type="button" class="btn show-detail" onclick="showDetail(${course.id
            })">详细信息</button>
            </td>
        `;
        tableBody.appendChild(row);
    }
}

async function addCourse(course_id) {
      // 找到包含指定 course_id 的表格行
      const courseRow = document.querySelector(
        `#available-courses-list tr td input[name="kcrwdm"][value="${course_id}"]`
    );
    if (!courseRow) {
        showDialog("错误", "找不到课程信息");
        return;
    }

    const tr = courseRow.closest("tr");
    const kcrwdm = tr.querySelector('input[name="kcrwdm"]').value;
    const kcmc = tr.querySelector('input[name="kcmc"]').value;
    const teacher = tr.querySelector('input[name="teacher"]').value;
    const preset = tr.querySelector('input[name="preset"]').value;
    const remark = tr.querySelector('input[name="remark"]').value;

    // 发送 POST 请求到 /add_course
    const courseData = {
        id: parseInt(kcrwdm),
        name: kcmc,
        teacher: teacher,
        category: "自定义",
        source: 0,
        note: remark,
    };
    addCourseToSelectedList(courseData);
    await saveGrabberTask(false);
}
function addCourseToSelectedList(course) {
    const configTableBody = document.querySelector(
        "#config-dialog #config-table tbody"
    );
    const courseEntry = document.createElement("tr");
    courseEntry.innerHTML = `
      <td>
        ${course.name} (${course.id})
        </td>
      <td>
         ${course.teacher}
        </td>
        <td>
           <input type="text" value="${course.note || ""}" data-course-id="${course.id
        }" ${course.source === 0 ? "readonly" : ""}
              onchange="updateCourseNote(this)"/>
        </td>
    
      <td>
         <button class="btn" onclick="removeCourseFromConfig(${course.id
        })">-</button>
    </td>
    `;
    configTableBody.appendChild(courseEntry);
    checkCoursesCount();
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

async function start() {
      if(!tasks || tasks.length === 0){
          showDialog("错误","请先保存配置")
          return;
      }
    try {
        const configTableBody = document.querySelector(
            "#config-dialog #config-table tbody"
        );
        let courses = [];
        configTableBody.querySelectorAll("tr").forEach((courseEntry) => {
            const courseNameInput = courseEntry.querySelector("td:nth-child(1) input");
            const courseNameText = courseEntry.querySelector("td:nth-child(1)")?.textContent;

            const inputString = courseNameInput ? courseNameInput.value : courseNameText;

            const regex = /(.+?)\s*[(\uff08(]*([\w\d\s]+?)[)\uff09)]*\s*$/;
            const match = inputString.match(regex);

            let name = "";
            let code = "";

            if (match) {
                name = match[1].trim();
                code = match[2].trim();
            }else{
              name = inputString.trim();
              code = inputString.trim();
            }
            let teacher =
                courseEntry.querySelector("td:nth-child(2) input")?.value ||
                courseEntry.querySelector("td:nth-child(2)").textContent;
             teacher = teacher ? teacher.trim().replace(/\s+/g, ' ') : "";
             const note = courseEntry.querySelector("td:nth-child(3) input").value;

            courses.push({
                id: parseInt(code),
                name: name,
                teacher: teacher,
                category: "自定义",
                source: 1,
                note: note,
            });
        });

        if (!courses || courses.length === 0) {
            showDialog("错误", "请选择需要抢课的课程");
            return;
        }
        const startTimeInput = document.getElementById("start-time-config");
        const advanceTimeInput = document.getElementById("offset-config");
        const grabberConfig = {
            startAt: startTimeInput.value
                ? new Date(startTimeInput.value).toISOString()
                : null,
            advanceTime: parseInt(advanceTimeInput.value),
        };
        const grabberTask = {
            account: {
                session_id: session_id,
            },
            config: {
                delay: "PT0.5S",
                start_at: grabberConfig.startAt,
                retry: true,
            },
            courses: courses,
        };
        
        document.getElementById("start-qk-btn").disabled = true;
        document.getElementById("stop-qk-btn").disabled = false;

        const response = await fetch(`${API_BASE_URL}/grabber/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(grabberTask),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            showDialog("错误", data.error);
              document.getElementById("start-qk-btn").disabled = false;
              document.getElementById("stop-qk-btn").disabled = true;
            return;
        }
        showDialog("信息", "抢课任务添加成功");
    } catch (e) {
        showDialog("错误", `开始抢课失败: ${e.message}`);
            document.getElementById("start-qk-btn").disabled = false;
            document.getElementById("stop-qk-btn").disabled = true;
    }
}
async function stop() {
    try {
        document.getElementById("start-qk-btn").disabled = false;
        document.getElementById("stop-qk-btn").disabled = true;
        const response = await fetch(`${API_BASE_URL}/grabber/0/cancel`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            showDialog("错误", data.error);
             document.getElementById("start-qk-btn").disabled = true;
            document.getElementById("stop-qk-btn").disabled = false;
            return;
        }
        if (data.data) {
            showDialog("信息", "取消成功");
        } else {
            showDialog("错误", "取消失败");
        }
    } catch (error) {
        showDialog("错误", `停止抢课失败，请查看控制台错误信息: ${error.message}`);
            document.getElementById("start-qk-btn").disabled = true;
            document.getElementById("stop-qk-btn").disabled = false;
    }
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

async function showDetail(courseId) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/eas/courses/${courseId}/lessons?session_id=${session_id}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            showDialog(
                "错误",
                `获取课程详细信息失败: ${data.error} - ${data.message}`
            );
            return;
        }
        const courseDetail = data.data;
        let detailHTML = "";
        if (courseDetail && courseDetail.length > 0) {
            detailHTML = courseDetail
                .map(
                    (lesson) => `
                     <p><strong>名称:</strong> ${lesson.name || "N/A"}</p>
                    <p><strong>学期:</strong> ${lesson.term || "N/A"}</p>
                  <p><strong>周次:</strong> ${lesson.week || "N/A"}</p>
                    <p><strong>星期:</strong> ${lesson.day || "N/A"}</p>
                    <p><strong>内容类型:</strong> ${lesson.content_type || "N/A"
                        }</p>
                   <p><strong>地点类型:</strong> ${lesson.location_type || "N/A"
                        }</p>
                     <p><strong>上课地点:</strong> ${lesson.location || "N/A"
                        }</p>
                    <p><strong>教师:</strong> ${lesson.teachers ? lesson.teachers.join(",") : "N/A"
                        }</p>
                  <p><strong>节次:</strong> ${lesson.sessions ? lesson.sessions.join(",") : "N/A"
                        }</p><hr>
                `
                )
                .join("");
        } else {
            detailHTML = "<p>没有课程详情</p>";
        }
        showDialog("课程详细信息", detailHTML);
    } catch (error) {
        showDialog(
            "错误",
            `获取课程详细信息失败，请查看控制台错误信息: ${error.message}`
        );
    }
}

function startPolling() {
    fetchLogs();
    setInterval(fetchLogs, 500); // 每0.5秒刷新一次
}

// window.onload = startPolling;

// 保存备注功能
function saveRemark(kcrwdm) {
    const courseEntry = document.querySelector(
        `input[name="kcrwdm"][value="${kcrwdm}"]`
    ).parentElement;
    const remarkInput = courseEntry.querySelector('input[name="remark"]');
    const remark = remarkInput.value;
    const courseData = {
        kcrwdm: kcrwdm,
        remark: remark,
    };

    fetch("/update_remark", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(courseData),
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
function removeCourseFromConfig(courseId) {
    const configTableBody = document.querySelector(
        "#config-dialog #config-table tbody"
    );
    configTableBody
        .querySelector(`tr input[data-course-id="${courseId}"]`)
        .closest("tr")
        .remove();
    loadConfigCourses();
}

function loadConfigCourses() {
    const configTableBody = document.querySelector(
        "#config-dialog #config-table tbody"
    );
    configTableBody.innerHTML = "";
    let courses = [];
    const storedConfig = localStorage.getItem("grabberConfig");
    if (storedConfig) {
        courses = JSON.parse(storedConfig)?.courses;
    }

    if (!courses || courses.length === 0) {
        return;
    }
    courses.forEach((course) => {
        addCourseToSelectedList(course);
    });
}
//更新课程备注
function updateCourseNote(inputElement) {
    const courseId = parseInt(inputElement.dataset.courseId);
    const tr = inputElement.closest("tr");
    const kcmc =
        tr.querySelector("td:nth-child(1) input")?.value ||
        tr.querySelector("td:nth-child(1)").textContent.match(/^([^)]+)\s/)[1];
    const teacher =
        tr.querySelector("td:nth-child(2) input")?.value ||
        tr.querySelector("td:nth-child(2)").textContent;
    const newNote = inputElement.value;
    const courseData = {
        id: courseId,
        name: kcmc,
        teacher: teacher,
        category: "自定义",
        source: 1,
        note: newNote,
    };
    const storedConfig = localStorage.getItem("grabberConfig");
    let grabberConfig;
    if (storedConfig) {
        grabberConfig = JSON.parse(storedConfig);
    } else {
        grabberConfig = {
            courses: [],
        };
    }
    const courses = grabberConfig.courses;
    const index = courses.findIndex((course) => course.id === courseId);
    if (index !== -1) {
        courses[index].note = newNote;
        localStorage.setItem("grabberConfig", JSON.stringify(grabberConfig));
    }
}
function updateButtonStatus() {
    const startButton = document.getElementById("start-qk-btn");
    const stopButton = document.getElementById("stop-qk-btn");
  
    // 初始状态：开始抢课按钮启用，停止抢课按钮禁用
     startButton.disabled = false;
     stopButton.disabled = true;
}
async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/grabber/`, {
            method: "GET",
        });
         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if(data.error){
            tasks = [];
        }
        else{
              tasks = data.data;
        }
     
    } catch (error) {
        console.error("获取tasks失败:", error);
    }
}

async function saveGrabberTask(show_dialog = true) {
      const startTimeInput = document.getElementById("start-time-config").value;
    const offsetInput = document.getElementById("offset-config").value;
     const configTableBody = document.querySelector(
        "#config-dialog #config-table tbody"
    );
    let courses = [];
     configTableBody.querySelectorAll("tr").forEach((courseEntry) => {
            const courseNameInput = courseEntry.querySelector("td:nth-child(1) input");
            const courseNameText = courseEntry.querySelector("td:nth-child(1)")?.textContent;

            const inputString = courseNameInput ? courseNameInput.value : courseNameText;

            const regex = /(.+?)\s*[(\uff08(]*([\w\d\s]+?)[)\uff09)]*\s*$/;
            const match = inputString.match(regex);

            let name = "";
            let code = "";

            if (match) {
                name = match[1].trim();
                code = match[2].trim();
            }else{
              name = inputString.trim();
              code = inputString.trim();
            }
            let teacher =
                courseEntry.querySelector("td:nth-child(2) input")?.value ||
                courseEntry.querySelector("td:nth-child(2)").textContent;
             teacher = teacher ? teacher.trim().replace(/\s+/g, ' ') : "";
            const note = courseEntry.querySelector("td:nth-child(3) input").value;

            courses.push({
                id: parseInt(code),
                name: name,
                teacher: teacher,
                category: "自定义课程",
                source: 1,
                note: note,
            });
        });
     const grabberConfig = {
        startAt: startTimeInput ? new Date(startTimeInput).toISOString() : null,
        advanceTime: parseInt(offsetInput),
        courses: courses,
    };
      localStorage.setItem("grabberConfig", JSON.stringify(grabberConfig));
        const grabberTask = {
            account: {
                session_id: session_id,
            },
            config: {
                delay: "PT0.5S",
                start_at: grabberConfig.startAt,
                retry: true,
            },
            courses: courses,
        };
        let response;
          if (tasks && tasks.length > 0) {
               response = await fetch(`${API_BASE_URL}/grabber/${tasks[0].key}`, {
                  method: "PUT",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify(grabberTask),
              });
          } else {
              response = await fetch(`${API_BASE_URL}/grabber/`, {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/json",
                  },
                  body: JSON.stringify(grabberTask),
              });
          }
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
             const data = await response.json();
                if (data.error) {
                    showDialog("错误", data.error);
                       return
                }
          await  fetchTasks();
        if(show_dialog){
            showDialog("信息", "配置保存成功");
        }
}

// 保存抢课配置功能
async function saveGrabCourseConfig() {
      await saveGrabberTask()
      document.querySelector("#config-dialog").close();
}

function openConfigDialog() {
    const storedConfig = localStorage.getItem("grabberConfig");
    let grabberConfig;
    if (storedConfig) {
        grabberConfig = JSON.parse(storedConfig);
    } else {
        grabberConfig = {
            courses: [],
            startAt: null,
            advanceTime: 0,
        };
    }

    const startTimeInput = document.getElementById("start-time-config");
    const offsetInput = document.getElementById("offset-config");
    if (grabberConfig.startAt) {
        startTimeInput.value = new Date(grabberConfig.startAt)
            .toISOString()
            .slice(0, 16);
    } else {
        startTimeInput.value = null;
    }
    offsetInput.value = grabberConfig.advanceTime;

    loadConfigCourses();
    document.getElementById("config-dialog").showModal();
}