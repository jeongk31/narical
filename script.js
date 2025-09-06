// 시간표 데이터 (요일별 교시별 반 정보) - 이미지 기반
const timetableData = {
    '월': {
        1: null, 2: 7, 3: 9, 4: null, 5: 8, 6: 4, 7: null
    },
    '화': {
        1: 1, 2: 3, 3: null, 4: 2, 5: 6, 6: null, 7: 10
    },
    '수': {
        1: null, 2: null, 3: 9, 4: 5, 5: null, 6: 8, 7: null
    },
    '목': {
        1: 10, 2: null, 3: 2, 4: null, 5: 3, 6: 5, 7: null
    },
    '금': {
        1: 7, 2: 6, 3: null, 4: 1, 5: 4, 6: null, 7: '동아리'
    }
};

// 전역 변수
let currentDate = new Date(); // 오늘 날짜
let startDate = new Date(); // 오늘 날짜
let endDate = new Date(2026, 1, 1); // 2026년 2월 1일

// 완료된 수업 추적 (날짜별 교시별)
let completedClasses = {};

// 한국 시간으로 오늘 날짜 가져오기
function getKoreanDate() {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreanTime;
}

// 수업 완료 상태 확인
function isClassCompleted(date, period) {
    const dateKey = formatDate(date);
    return completedClasses[dateKey] && completedClasses[dateKey][period] === true;
}

// 수업 완료 상태 토글
function toggleClassCompletion(date, period) {
    const dateKey = formatDate(date);
    if (!completedClasses[dateKey]) {
        completedClasses[dateKey] = {};
    }
    completedClasses[dateKey][period] = !completedClasses[dateKey][period];
    
    // 로컬 스토리지에 저장
    localStorage.setItem('completedClasses', JSON.stringify(completedClasses));
    
    // 달력 다시 렌더링
    renderCalendar();
    updateClassesRemaining();
    updateWeeklyClassesRemaining();
    updateMonthlyClassesRemaining();
}

// 로컬 스토리지에서 완료된 수업 로드
function loadCompletedClasses() {
    const saved = localStorage.getItem('completedClasses');
    if (saved) {
        completedClasses = JSON.parse(saved);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 완료된 수업 로드
    loadCompletedClasses();
    
    // 오늘 날짜 설정 (한국 시간)
    const today = getKoreanDate();
    const todayString = today.toISOString().split('T')[0];
    document.getElementById('startDate').value = todayString;
    
    // 오늘 날짜 표시
    document.getElementById('todayDate').textContent = todayString;
    
    // 남은 일수 계산 및 표시
    updateDaysRemaining();
    
    // 남은 수업 수 계산 및 표시
    updateClassesRemaining();
    updateWeeklyClassesRemaining();
    updateMonthlyClassesRemaining();
    
    updateCalendar();
});

// 달력 업데이트
function updateCalendar() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    startDate = new Date(startDateInput.value);
    endDate = new Date(endDateInput.value);
    
    updateDaysRemaining();
    updateClassesRemaining();
    updateWeeklyClassesRemaining();
    updateMonthlyClassesRemaining();
    renderCalendar();
}

// 남은 일수 업데이트
function updateDaysRemaining() {
    const endDateInput = document.getElementById('endDate');
    const endDate = new Date(endDateInput.value);
    const daysRemaining = getDaysRemaining(endDate);
    
    const daysRemainingElement = document.getElementById('daysRemaining');
    if (daysRemaining > 0) {
        daysRemainingElement.textContent = `${daysRemaining}일`;
        daysRemainingElement.style.color = '#e74c3c';
    } else if (daysRemaining === 0) {
        daysRemainingElement.textContent = '오늘';
        daysRemainingElement.style.color = '#f39c12';
    } else {
        daysRemainingElement.textContent = '기간 종료';
        daysRemainingElement.style.color = '#95a5a6';
    }
}

// 남은 수업 수 업데이트
function updateClassesRemaining() {
    const endDateInput = document.getElementById('endDate');
    const endDate = new Date(endDateInput.value);
    const today = getKoreanDate();
    today.setHours(0, 0, 0, 0);
    
    let totalClasses = 0;
    let currentDate = new Date(today);
    
    while (currentDate <= endDate) {
        const classes = getClassesForDate(currentDate);
        // 완료되지 않은 수업만 카운트
        const incompleteClasses = classes.filter(classInfo => !isClassCompleted(currentDate, classInfo.period));
        totalClasses += incompleteClasses.length;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const classesRemainingElement = document.getElementById('classesRemaining');
    classesRemainingElement.textContent = `${totalClasses}교시`;
    classesRemainingElement.style.color = '#27ae60';
}

// 이번주 남은 수업 수 업데이트
function updateWeeklyClassesRemaining() {
    const today = getKoreanDate();
    today.setHours(0, 0, 0, 0);
    
    // 이번주 일요일 계산
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    // 이번주 토요일 계산
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // 종료일과 비교하여 더 이른 날짜 사용
    const endDateInput = document.getElementById('endDate');
    const endDate = new Date(endDateInput.value);
    const actualWeekEnd = weekEnd < endDate ? weekEnd : endDate;
    
    let totalClasses = 0;
    let currentDate = new Date(today);
    
    while (currentDate <= actualWeekEnd) {
        const classes = getClassesForDate(currentDate);
        // 완료되지 않은 수업만 카운트
        const incompleteClasses = classes.filter(classInfo => !isClassCompleted(currentDate, classInfo.period));
        totalClasses += incompleteClasses.length;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const weeklyClassesRemainingElement = document.getElementById('weeklyClassesRemaining');
    weeklyClassesRemainingElement.textContent = `${totalClasses}교시`;
    weeklyClassesRemainingElement.style.color = '#3498db';
}

// 이번달 남은 수업 수 업데이트
function updateMonthlyClassesRemaining() {
    const today = getKoreanDate();
    today.setHours(0, 0, 0, 0);
    
    // 이번달 마지막 날 계산
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // 종료일과 비교하여 더 이른 날짜 사용
    const endDateInput = document.getElementById('endDate');
    const endDate = new Date(endDateInput.value);
    const actualMonthEnd = monthEnd < endDate ? monthEnd : endDate;
    
    let totalClasses = 0;
    let currentDate = new Date(today);
    
    while (currentDate <= actualMonthEnd) {
        const classes = getClassesForDate(currentDate);
        // 완료되지 않은 수업만 카운트
        const incompleteClasses = classes.filter(classInfo => !isClassCompleted(currentDate, classInfo.period));
        totalClasses += incompleteClasses.length;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const monthlyClassesRemainingElement = document.getElementById('monthlyClassesRemaining');
    monthlyClassesRemainingElement.textContent = `${totalClasses}교시`;
    monthlyClassesRemainingElement.style.color = '#9b59b6';
}

// 달력 렌더링
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    
    // 현재 월 표시
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    currentMonthElement.textContent = `${year}년 ${month}월`;
    
    // 달력 그리드 초기화
    calendarDays.innerHTML = '';
    
    // 월의 첫 번째 날과 마지막 날 계산
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - firstDay.getDay());
    
    // 달력 날짜 생성
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDay);
        date.setDate(startDay.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        // 다른 월의 날짜인지 확인
        if (date.getMonth() !== month - 1) {
            dayElement.classList.add('other-month');
        }
        
        // 날짜 번호
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        
        // 오늘 날짜 확인 (한국 시간)
        const today = getKoreanDate();
        today.setHours(0, 0, 0, 0);
        const currentDateOnly = new Date(date);
        currentDateOnly.setHours(0, 0, 0, 0);
        
        if (currentDateOnly < today) {
            // 지난 날짜는 X 표시
            dayNumber.textContent = 'X';
            dayElement.classList.add('passed-day');
        } else {
            dayNumber.textContent = date.getDate();
        }
        
        dayElement.appendChild(dayNumber);
        
        // 해당 날짜의 수업 정보 추가
        const classes = getClassesForDate(date);
        classes.forEach(classInfo => {
            const classElement = document.createElement('div');
            classElement.className = 'class-item-container';
            
            // 체크 아이콘
            const checkIcon = document.createElement('span');
            checkIcon.className = 'check-icon';
            checkIcon.textContent = '✓';
            checkIcon.onclick = () => toggleClassCompletion(date, classInfo.period);
            
            // 수업 정보
            const classInfoElement = document.createElement('span');
            classInfoElement.className = 'class-info';
            if (classInfo.class === '동아리') {
                classInfoElement.className += ' class-club';
                classInfoElement.textContent = `${classInfo.period}교시 동아리`;
            } else {
                classInfoElement.className += ` class-${classInfo.class}`;
                classInfoElement.textContent = `${classInfo.period}교시 ${classInfo.class}반`;
            }
            
            // 완료 상태 확인 및 스타일 적용
            if (isClassCompleted(date, classInfo.period)) {
                classInfoElement.classList.add('completed');
                checkIcon.classList.add('checked');
            }
            
            classElement.appendChild(checkIcon);
            classElement.appendChild(classInfoElement);
            dayElement.appendChild(classElement);
        });
        
        calendarDays.appendChild(dayElement);
    }
}

// 특정 날짜의 수업 정보 가져오기
function getClassesForDate(date) {
    const classes = [];
    const dayOfWeek = getDayOfWeek(date);
    
    if (timetableData[dayOfWeek]) {
        for (let period = 1; period <= 7; period++) {
            const classNum = timetableData[dayOfWeek][period];
            if (classNum !== null) {
                classes.push({
                    period: period,
                    class: classNum
                });
            }
        }
    }
    
    return classes;
}

// 오늘부터 특정 날짜까지 남은 일수 계산
function getDaysRemaining(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// 날짜의 요일 가져오기
function getDayOfWeek(date) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
}

// 이전 월
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

// 다음 월
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}



// 날짜 포맷팅
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
