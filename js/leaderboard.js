let currentEduType = 'تعليم عام';

async function loadLeaderboard() {
    const grade = document.getElementById('grade-filter').value;
    const listContainer = document.getElementById('leaderboard-list');
    listContainer.innerHTML = '<p style="text-align: center;">جاري تحميل الترتيب...</p>';

    try {
        // جلب الطلاب حسب الصف والشعبة فقط (بدون ترتيب مباشر من السيرفر لتفادي أخطاء الـ Index)
        const snapshot = await db.collection('students')
            .where('grade', '==', grade)
            .where('educationType', '==', currentEduType)
            .get();

        let studentsArray = [];
        snapshot.forEach(doc => {
            studentsArray.push(doc.data());
        });

        // ترتيب الطلاب محلياً حسب النقاط تنازلياً (الأعلى نقاطاً أولاً)
        studentsArray.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

        listContainer.innerHTML = '';

        if (studentsArray.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #666;">لا يوجد طلاب في هذا القسم حالياً.</p>';
            return;
        }

        let rank = 1;
        studentsArray.forEach(data => {
            const card = document.createElement('div');

            // تمييز الثلاثة الأوائل
            let specialClass = '';
            let medal = '';
            if (rank === 1) { specialClass = 'top-1'; medal = '🥇'; }
            else if (rank === 2) { specialClass = 'top-2'; medal = '🥈'; }
            else if (rank === 3) { specialClass = 'top-3'; medal = '🥉'; }

            card.className = `rank-card ${specialClass}`;
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="rank-number">${rank}</div>
                    <div>
                        <strong style="font-size: 1.1rem;">${medal} ${data.username}</strong>
                        <div style="font-size: 0.8rem; color: #666;">${data.educationType} - الصف: ${data.grade}</div>
                    </div>
                </div>
                <div class="points-badge">${data.totalPoints || 0} نقطة</div>
            `;
            listContainer.appendChild(card);
            rank++;
        });

    } catch (error) {
        console.error("خطأ في جلب لوحة الشرف:", error);
        listContainer.innerHTML = '<p style="text-align: center; color: red;">حدث خطأ أثناء تحميل البيانات. تأكد من الاتصال بالإنترنت.</p>';
    }
}

function switchEduType(type, btn) {
    currentEduType = type;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadLeaderboard();
}

// تشغيل عند التحميل
window.onload = loadLeaderboard;