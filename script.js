document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupDiv = document.getElementById('setup');
    const mainContentDiv = document.getElementById('main-content');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const totalDaysInput = document.getElementById('total-days');
    const totalHoursInput = document.getElementById('total-hours');
    const dailyInputsDiv = document.getElementById('daily-inputs');
    const totalStatusSpan = document.getElementById('total-status');
    const remainingHoursSpan = document.getElementById('remaining-hours');
    const projectedStatusSpan = document.getElementById('projected-status');

    // App state and constants
    const STORAGE_KEY = 'workHourCalculatorData';
    let standardHoursPerDay = 0;
    let totalRequiredHours = 0;

    // --- Main Logic ---

    // Load state from localStorage on startup
    loadState();

    // --- Event Listeners ---

    startBtn.addEventListener('click', () => {
        const totalDays = parseInt(totalDaysInput.value, 10);
        const requiredHours = parseInt(totalHoursInput.value, 10);

        if (isNaN(totalDays) || isNaN(requiredHours) || totalDays <= 0 || requiredHours <= 0) {
            alert('有効な数値を入力してください。');
            return;
        }

        totalRequiredHours = requiredHours;
        standardHoursPerDay = totalRequiredHours / totalDays;
        
        setupDiv.classList.add('hidden');
        mainContentDiv.classList.remove('hidden');

        generateDailyInputs(totalDays);
        saveState(); // Save initial state
        updateCalculations();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('本当に全てリセットしますか？入力したデータは消去されます。')) {
            localStorage.removeItem(STORAGE_KEY);
            
            // Reset UI to initial state
            setupDiv.classList.remove('hidden');
            mainContentDiv.classList.add('hidden');
            
            totalDaysInput.value = '';
            totalHoursInput.value = '';
            dailyInputsDiv.innerHTML = '';

            // Reset state variables
            standardHoursPerDay = 0;
            totalRequiredHours = 0;
        }
    });

    dailyInputsDiv.addEventListener('input', (event) => {
        if (event.target.classList.contains('daily-hour-input') || event.target.classList.contains('daily-minute-input')) {
            updateCalculations();
            saveState(); // Save on every input change
        }
    });

    // --- Functions ---

    function generateDailyInputs(days) {
        dailyInputsDiv.innerHTML = '';
        for (let i = 1; i <= days; i++) {
            const row = document.createElement('div');
            row.className = 'daily-input-row';
            row.id = `row-${i}`;
            row.innerHTML = `
                <label>${i}日</label>
                <div class="time-input-wrapper">
                    <input type="number" class="daily-hour-input" min="0" max="24" placeholder="時" data-day="${i}">
                    <span>時間</span>
                    <input type="number" class="daily-minute-input" min="0" max="59" step="15" placeholder="分" data-day="${i}">
                    <span>分</span>
                </div>
                <span class="status" id="status-${i}"></span>
            `;
            dailyInputsDiv.appendChild(row);
        }
    }

    function updateCalculations() {
        let cumulativeActualHours = 0;
        let projectedTotalHours = 0;
        let lastDayWithInput = 0;

        const totalDays = parseInt(totalDaysInput.value, 10);
        if (isNaN(totalDays)) return;

        for (let day = 1; day <= totalDays; day++) {
            const hourInput = document.querySelector(`.daily-hour-input[data-day='${day}']`);
            const minuteInput = document.querySelector(`.daily-minute-input[data-day='${day}']`);

            const hours = parseInt(hourInput.value, 10) || 0;
            const minutes = parseInt(minuteInput.value, 10) || 0;
            
            const dailyTotalHours = hours + minutes / 60;

            const statusSpan = document.getElementById(`status-${day}`);

            if (hourInput.value !== '' || minuteInput.value !== '') {
                if (dailyTotalHours > 0) lastDayWithInput = day;
                cumulativeActualHours += dailyTotalHours;
                projectedTotalHours += dailyTotalHours;

                const cumulativeExpectedHours = day * standardHoursPerDay;
                const difference = cumulativeActualHours - cumulativeExpectedHours;
                
                statusSpan.textContent = formatHours(difference);
                statusSpan.className = 'status';
                if (difference > 0) {
                    statusSpan.classList.add('positive');
                } else if (difference < 0) {
                    statusSpan.classList.add('negative');
                }
            } else {
                projectedTotalHours += 8; // 8時間労働と仮定
                statusSpan.textContent = '';
                statusSpan.className = 'status';
            }
        }

        // 実績サマリーの更新
        const cumulativeExpectedHoursForActual = lastDayWithInput * standardHoursPerDay;
        const totalDifference = cumulativeActualHours - cumulativeExpectedHoursForActual;
        
        totalStatusSpan.textContent = formatHours(totalDifference, true);
        totalStatusSpan.className = '';
        if (totalDifference > 0) {
            totalStatusSpan.classList.add('positive');
        } else if (totalDifference < 0) {
            totalStatusSpan.classList.add('negative');
        }

        const remainingHours = totalRequiredHours - cumulativeActualHours;
        remainingHoursSpan.textContent = formatHours(remainingHours > 0 ? remainingHours : 0);

        // 予測サマリーの更新
        const projectedDifference = projectedTotalHours - totalRequiredHours;
        projectedStatusSpan.textContent = formatHours(projectedDifference, true);
        projectedStatusSpan.className = '';
        if (projectedDifference > 0) {
            projectedStatusSpan.classList.add('positive');
        } else if (projectedDifference < 0) {
            projectedStatusSpan.classList.add('negative');
        }
    }

    function formatHours(decimalHours, withSign = false) {
        const sign = decimalHours < 0 ? '-' : '+';
        const absDecimalHours = Math.abs(decimalHours);
        
        const totalMinutes = Math.round(absDecimalHours * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const timeString = `${hours}時間 ${minutes}分`;

        return withSign ? `${sign}${timeString}` : timeString;
    }

    function saveState() {
        const dailyInputs = {};
        const totalDays = parseInt(totalDaysInput.value, 10);
        if (isNaN(totalDays)) return;

        for (let day = 1; day <= totalDays; day++) {
            const hourInput = document.querySelector(`.daily-hour-input[data-day='${day}']`);
            const minuteInput = document.querySelector(`.daily-minute-input[data-day='${day}']`);
            if (hourInput.value || minuteInput.value) {
                dailyInputs[day] = {
                    hours: hourInput.value,
                    minutes: minuteInput.value
                };
            }
        }

        const state = {
            totalDays: totalDaysInput.value,
            totalHours: totalHoursInput.value,
            dailyInputs: dailyInputs
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const state = JSON.parse(savedState);

            totalDaysInput.value = state.totalDays;
            totalHoursInput.value = state.totalHours;

            const totalDays = parseInt(state.totalDays, 10);
            totalRequiredHours = parseInt(state.totalHours, 10);

            if (isNaN(totalDays) || isNaN(totalRequiredHours) || totalDays <= 0 || totalRequiredHours <= 0) {
                localStorage.removeItem(STORAGE_KEY); // Clear invalid data
                return;
            }

            standardHoursPerDay = totalRequiredHours / totalDays;

            setupDiv.classList.add('hidden');
            mainContentDiv.classList.remove('hidden');

            generateDailyInputs(totalDays);

            if (state.dailyInputs) {
                for (const day in state.dailyInputs) {
                    const hourInput = document.querySelector(`.daily-hour-input[data-day='${day}']`);
                    const minuteInput = document.querySelector(`.daily-minute-input[data-day='${day}']`);
                    if (hourInput && minuteInput) {
                        hourInput.value = state.dailyInputs[day].hours;
                        minuteInput.value = state.dailyInputs[day].minutes;
                    }
                }
            }
            
            updateCalculations();
        }
    }
});
