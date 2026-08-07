// خريطة أسماء الصفوف الدراسية لتوضيحها للطالب
const gradeNames = {
    "3-prep": "الصف الثالث الإعدادي",
    "1-sec": "الصف الأول الثانوي",
    "2-sec": "الصف الثاني الثانوي",
    "3-sec": "الصف الثالث الثانوي"
};

// دالة التنبيهات الانسيابية الحديثة (تجنباً لأي رسائل منفرة)
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

window.onload = async function() {
    // 1. التحقق من تسجيل دخول الطالب محلياً وجلسة العمل
    const savedUser = JSON.parse(localStorage.getItem('studentSession'));

    if (!savedUser || !savedUser.isRegistered) {
        showToast('يجب تسجيل دخول الطالب أولاً!', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
        return;
    }

    // عرض اسم الصف والشعبة بجانب اسم الطالب لزيادة التوضيح
    const studentGradeName = gradeNames[savedUser.grade] || savedUser.grade;
    const studentEduType = savedUser.educationType || 'تعليم عام';

    const welcomeElem = document.getElementById('welcome-student');
    if (welcomeElem) {
        welcomeElem.innerText = `أهلاً بك، ${savedUser.username} (${studentGradeName} - ${studentEduType})`;
    }

    const container = document.getElementById('exams-container');
    const finishedContainer = document.getElementById('finished-exams-container');

    if (container) container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">جاري تحميل الامتحانات المخصصة لشعبتك من السيرفر...</p>`;
    if (finishedContainer) finishedContainer.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">جاري التحميل...</p>`;

    try {
        // 2. جلب الامتحانات من قاعدة بيانات فايربيس (Firebase Firestore) أونلاين
        const snapshot = await db.collection('exams').get();
        const allExams = [];

        snapshot.forEach(doc => {
            allExams.push({ id: doc.id, ...doc.data() });
        });

        console.log("الامتحانات المسترجعة من السيرفر:", allExams);
        console.log("بيانات الطالب الحالي:", savedUser);

        // تجهيز بيانات الطالب للفلترة المرنة
        const cleanStudentGrade = (savedUser.grade || '').trim();
        const cleanStudentEdu = (studentEduType || '').trim();

        // 3. التصفية الصارمة والمرنة معاً: فلترة الامتحانات حسب (الصف الدراسي + نوع التعليم/الشعبة)
        const studentExams = allExams.filter(exam => {
            const examGrade = (exam.grade || '').trim();
            const matchGrade = examGrade === cleanStudentGrade;

            const examEduType = (exam.educationType || 'تعليم عام').trim();

            // مطльтраة ذكية ومرنة تقبل مختلف الصيغ المسجلة
            const matchEduType = (examEduType === 'الكل') ||
                                 (examEduType === cleanStudentEdu) ||
                                 (examEduType.includes('أزهر') && cleanStudentEdu.includes('أزهر')) ||
                                 (examEduType.includes('عام') && cleanStudentEdu.includes('عام')) ||
                                 (cleanStudentEdu.includes('أزهر') && examEduType.includes('أزهر')) ||
                                 (cleanStudentEdu.includes('عام') && examEduType.includes('عام'));

            return matchGrade && matchEduType;
        });

        const studentResults = JSON.parse(localStorage.getItem(`results_${savedUser.username}`)) || {};

        if (container) container.innerHTML = "";
        if (finishedContainer) finishedContainer.innerHTML = "";

        let hasFinished = false;

        if (studentExams.length === 0) {
            if (container) {
                container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">لا توجد اختبارات متاحـة حالياً لشعبتك الدراسية (${studentGradeName} - ${studentEduType}). انتظر إضافتها قريباً!</p>`;
            }
        }

        studentExams.forEach(exam => {
            const isFinished = studentResults[exam.id] !== undefined;

            if (!isFinished) {
                if (container) {
                    const card = document.createElement('div');
                    card.className = 'exam-card';
                    card.innerHTML = `
                        <div class="exam-info">
                            <h4>${exam.title}</h4>
                            <div class="exam-meta">
                                <span>📌 عدد الأسئلة: ${exam.questionsCount || (exam.questions ? exam.questions.length : 0)} أسئلة</span>
                                <span>⏳ الوقت: ${exam.time || 'غير محدد'}</span>
                                <span style="display:inline-block; margin-top:5px; background: rgba(59,130,246,0.1); color: var(--primary); padding:2px 8px; border-radius:4px; font-size:0.8rem;">شعبة: ${exam.educationType || 'تعليم عام'}</span>
                            </div>
                        </div>
                        <button class="btn-start" onclick="startExam('${exam.id}')">ابدأ الاختبار الآن</button>
                    `;
                    container.appendChild(card);
                }
            } else {
                hasFinished = true;
                if (finishedContainer) {
                    const resData = studentResults[exam.id];
                    const card = document.createElement('div');
                    card.className = 'exam-card';
                    card.style.borderColor = 'var(--accent)';
                    card.innerHTML = `
                        <div class="exam-info">
                            <h4>${exam.title}</h4>
                            <div class="exam-meta">
                                <span>🏆 النتيجة: ${resData.score} / ${resData.total} (${resData.percentage}%)</span>
                                <span>✅ الحالة: مكتمل ومنجز</span>
                            </div>
                        </div>
                        <button class="btn-submit" style="background-color: var(--accent); margin-top: 10px;" onclick="reviewExam('${exam.id}')">مراجعة الإجابات والشرح</button>
                    `;
                    finishedContainer.appendChild(card);
                }
            }
        });

        if (!hasFinished && finishedContainer) {
            finishedContainer.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">لم تنهِ أي اختبار بعد. ابدأ بأحد الاختبارات أعلاه!</p>`;
        }

    } catch (error) {
        console.error("خطأ في جلب الامتحانات من السيرفر:", error);
        if (container) {
            container.innerHTML = `<p style="color: #ef4444; grid-column: 1/-1;">حدث خطأ أثناء تحميل الامتحانات من السيرفر. التفاصيل: ${error.message}</p>`;
        }
    }
};

function startExam(examId) {
    window.location.href = `exam-room.html?id=${examId}`;
}

function reviewExam(examId) {
    window.location.href = `review.html?id=${examId}`;
}

function logout() {
    localStorage.removeItem('studentSession');
    showToast('تم تسجيل الخروج بنجاح', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 800);
}