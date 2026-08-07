let currentMode = 'login';

// قائمة الأكواد المحلية المعتمدة
const localKeys = [
    "ARABIC-150", "ARABIC-151", "ARABIC-152", "ARABIC-153", "ARABIC-154",
    "ARABIC-155", "ARABIC-156", "ARABIC-157", "ARABIC-158", "ARABIC-159",
    "ARABIC-160", "ARABIC-161", "ARABIC-162", "ARABIC-163", "ARABIC-164",
    "ARABIC-165", "ARABIC-166", "ARABIC-167", "ARABIC-168", "ARABIC-169",
    "ARABIC-170", "ARABIC-171", "ARABIC-172", "ARABIC-173", "ARABIC-174",
    "ARABIC-175", "ARABIC-176", "ARABIC-177", "ARABIC-178", "ARABIC-179",
    "ARABIC-180", "ARABIC-181", "ARABIC-182", "ARABIC-183", "ARABIC-184",
    "ARABIC-185", "ARABIC-186", "ARABIC-187", "ARABIC-188", "ARABIC-189",
    "ARABIC-190", "ARABIC-191", "ARABIC-192", "ARABIC-193", "ARABIC-194",
    "ARABIC-195", "ARABIC-196", "ARABIC-197", "ARABIC-198", "ARABIC-199",
    "ARABIC-200", "ARABIC-201", "ARABIC-202", "ARABIC-203", "ARABIC-204",
    "ARABIC-205", "ARABIC-206", "ARABIC-207", "ARABIC-208", "ARABIC-209",
    "ARABIC-210", "ARABIC-211", "ARABIC-212", "ARABIC-213", "ARABIC-214",
    "ARABIC-215", "ARABIC-216", "ARABIC-217", "ARABIC-218", "ARABIC-219",
    "ARABIC-220", "ARABIC-221", "ARABIC-222", "ARABIC-223", "ARABIC-224",
    "ARABIC-225", "ARABIC-226", "ARABIC-227", "ARABIC-228", "ARABIC-229",
    "ARABIC-230", "ARABIC-231", "ARABIC-232", "ARABIC-233", "ARABIC-234",
    "ARABIC-235", "ARABIC-236", "ARABIC-237", "ARABIC-238", "ARABIC-239",
    "ARABIC-240", "ARABIC-241", "ARABIC-242", "ARABIC-243", "ARABIC-244",
    "ARABIC-245", "ARABIC-246", "ARABIC-247", "ARABIC-248", "ARABIC-249",
    "ARABIC-250"
];

// دالة التنبيهات الانسيابية الحديثة
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✨' : '⚠️'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function switchMode(mode) {
    currentMode = mode;
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const gradeGroup = document.getElementById('grade-group');
    const educationTypeGroup = document.getElementById('education-type-group');
    const keyGroup = document.getElementById('key-group');
    const submitBtn = document.getElementById('submit-btn');

    if (!formTitle) return;

    if (mode === 'login') {
        formTitle.innerText = "تسجيل دخول الطلاب";
        formSubtitle.innerText = "أدخل بياناتك للمتابعة إلى امتحاناتك";
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        gradeGroup.classList.add('hidden');
        if (educationTypeGroup) educationTypeGroup.classList.add('hidden');
        keyGroup.classList.add('hidden');
        submitBtn.innerText = "دخول للمنصة";
    } else {
        formTitle.innerText = "إنشاء حساب جديد بالمفتاح";
        formSubtitle.innerText = "مفتاح التسجيل يُستخدم لمرة واحدة فقط";
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        gradeGroup.classList.remove('hidden');
        if (educationTypeGroup) educationTypeGroup.classList.remove('hidden');
        keyGroup.classList.remove('hidden');
        submitBtn.innerText = "إنشاء الحساب وتفعيل المفتاح";
    }
}

async function handleAuth(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // فحص دخول المعلمة الثابت
    if (username === "hend_admin" && password === "admin_password") {
        showToast('مرحباً بكِ يا هند في لوحة التحكم', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
        return;
    }

    if (currentMode === 'register') {
        const secretKey = document.getElementById('secret-key').value.trim();
        const studentGrade = document.getElementById('student-grade').value;
        const educationType = document.getElementById('education-type').value;

        if (!localKeys.includes(secretKey)) {
            showToast('مفتاح التسجيل غير صحيح! يرجى مراجعة المعلمة.', 'error');
            return;
        }

        try {
            const keyCheck = await db.collection('students').where('usedKey', '==', secretKey).get();
            let usedKeys = JSON.parse(localStorage.getItem('usedKeysList')) || [];

            if (!keyCheck.empty || usedKeys.includes(secretKey)) {
                showToast('هذا المفتاح تم استخدامه مسبقاً ولا يمكن تكراره!', 'error');
                return;
            }

            const userCheck = await db.collection('students').where('username', '==', username).get();
            let registeredUsers = JSON.parse(localStorage.getItem('localStudents')) || {};

            if (!userCheck.empty || registeredUsers[username]) {
                showToast('اسم المستخدم هذا مستخدم بالفعل، اختر اسم آخر.', 'error');
                return;
            }

            const userData = {
                username: username,
                password: password,
                grade: studentGrade,
                educationType: educationType === 'azhar' ? 'تعليم أزهري' : 'تعليم عام',
                usedKey: secretKey,
                isRegistered: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('students').add(userData);

            usedKeys.push(secretKey);
            localStorage.setItem('usedKeysList', JSON.stringify(usedKeys));
            registeredUsers[username] = userData;
            localStorage.setItem('localStudents', JSON.stringify(registeredUsers));

            let allAccounts = JSON.parse(localStorage.getItem('systemAllAccounts')) || [];
            allAccounts.push(userData);
            localStorage.setItem('systemAllAccounts', JSON.stringify(allAccounts));

            const sessionData = {
                username: userData.username,
                grade: userData.grade,
                educationType: userData.educationType,
                usedKey: userData.usedKey,
                isRegistered: true
            };

            localStorage.setItem('studentSession', JSON.stringify(sessionData));

            showToast('تم تفعيل المفتاح وإنشاء الحساب بنجاح!', 'success');
            setTimeout(() => {
                window.location.href = 'exams.html';
            }, 1000);

        } catch (error) {
            console.error("خطأ أثناء التسجيل:", error);
            showToast('حدث خطأ في الاتصال بالإنترنت.', 'error');
        }

    } else {
        // حالة تسجيل الدخول
        try {
            const querySnapshot = await db.collection('students').where('username', '==', username).get();
            let user = null;

            if (!querySnapshot.empty) {
                user = querySnapshot.docs[0].data();
            } else {
                let registeredUsers = JSON.parse(localStorage.getItem('localStudents')) || {};
                user = registeredUsers[username];
            }

            if (!user || String(user.password) !== String(password)) {
                showToast('اسم المستخدم أو كلمة المرور غير صحيحة!', 'error');
                return;
            }

            const sessionData = {
                username: user.username,
                grade: user.grade,
                educationType: user.educationType,
                usedKey: user.usedKey || '',
                isRegistered: true
            };

            localStorage.setItem('studentSession', JSON.stringify(sessionData));
            showToast(`أهلاً بك يا ${username}! تم تسجيل الدخول بنجاح.`, 'success');
            setTimeout(() => {
                window.location.href = 'exams.html';
            }, 1000);

        } catch (error) {
            console.error("خطأ أثناء تسجيل الدخول:", error);
            let registeredUsers = JSON.parse(localStorage.getItem('localStudents')) || {};
            const user = registeredUsers[username];

            if (!user || String(user.password) !== String(password)) {
                showToast('اسم المستخدم أو كلمة المرور غير صحيحة!', 'error');
                return;
            }

            const sessionData = {
                username: user.username,
                grade: user.grade,
                educationType: user.educationType,
                usedKey: user.usedKey || '',
                isRegistered: true
            };

            localStorage.setItem('studentSession', JSON.stringify(sessionData));
            showToast(`أهلاً بك يا ${username}! تم تسجيل الدخول بنجاح.`, 'success');
            setTimeout(() => {
                window.location.href = 'exams.html';
            }, 1000);
        }
    }
}

window.switchMode = switchMode;
window.handleAuth = handleAuth;