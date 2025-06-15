globalLoading = document.getElementById('global-loading');

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
    const panels = ['panel', 'settings'];
    panels.forEach((id, index) => {
        const panel = document.getElementById(id);
        if (index === panelId) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });
}

function initialize() {
    const cookieField = document.getElementById('cookie');
    if (localStorage.getItem('cookie')) {
        cookieField.value = localStorage.getItem('cookie');
    }

}

function saveAndLogin() {
    const cookieField = document.getElementById('cookie');
    if (!cookieField.value) {
        showDialog('错误', '请先输入 JSESSIONID 再进行登录', 'error');
        return;
    }
    localStorage.setItem('cookie', cookieField.value);
    const saveBtn = document.getElementById('save-config-btn');
    const loadingIndicator = document.getElementById('save-config-btn-loading');
    saveBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');
    login(cookieField.value).then(() => {
        loadingIndicator.classList.add('hidden');
        saveBtn.disabled = false;
        showDialog('成功', '登录成功！', 'success');
    }).catch((error) => {
        loadingIndicator.classList.add('hidden');
        saveBtn.disabled = false;
        showDialog('错误', `登录失败：${error.message}`, 'error');
    });
}

function login(cookie) {
    fetch()
}

function changePageSize(size) {
    
}