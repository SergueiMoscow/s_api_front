import { loadCashFlows } from './cashflows.js'
export class DateRangePicker {
    constructor() {
        this.previousPeriodButton = document.getElementById('previousPeriod');
        this.nextPeriodButton = document.getElementById('nextPeriod');
        this.dateBeginInput = document.getElementById('date-begin');
        this.dateEndInput = document.getElementById('date-end');

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.previousPeriodButton.addEventListener('click', () => this.movePeriod(-1));
        this.nextPeriodButton.addEventListener('click', () => this.movePeriod(1));
    }

    getDates() {
        const beginDate = this.dateBeginInput.valueAsDate;
        const endDate = this.dateEndInput.valueAsDate;
        return { begin: beginDate, end: endDate };
    }

    updateDateInputs(beginDate, endDate) {
        this.dateBeginInput.valueAsDate = beginDate;
        this.dateEndInput.valueAsDate = endDate;
    }

    movePeriod(direction) {
        const { begin, end } = this.getDates();
    
        // Проверяем, являются ли даты начала и конца первым и последним днем месяца соответственно
        const isFirstDayOfMonth = begin.getDate() === 1;
        const isLastDayOfMonth = end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    
        if (isFirstDayOfMonth && isLastDayOfMonth) {
            // Перемещаемся на целый месяц
            begin.setMonth(begin.getMonth() + direction);
            begin.setDate(1); // Устанавливаем первое число месяца
    
            // Устанавливаем последний день нового месяца
            end.setMonth(end.getMonth() + direction + 1); // Сначала переводим на следующий месяц
            end.setDate(0); // Затем выбираем его последний день
        } else {
            // Перемещаемся на дельту в днях
            const durationDays = (end - begin) / (1000 * 60 * 60 * 24);
            begin.setDate(begin.getDate() + direction * (durationDays + 1));
            end.setDate(end.getDate() + direction * (durationDays + 1));
        }
    
        this.updateDateInputs(begin, end);
        loadCashFlows();
    }
}
