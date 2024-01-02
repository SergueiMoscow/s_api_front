import { ajax } from './common.js';


const saveCategoriesByType = (key, response) => {
    localStorage.setItem(key, JSON.stringify(response.result));
};
const saveCategoriesExpense = (response) => {
    saveCategoriesByType('ExpenseCategories', response);
};
const saveCategoriesIncome = (response) => {
    saveCategoriesByType('IncomeCategories', response);
};
export const getCategoriesByType = () => {
    ajax({
        method: 'GET',
        url: 'budget/category?types=Income,Transfer',
        success: saveCategoriesIncome
    });
    ajax({
        method: 'GET',
        url: 'budget/category?types=Expense,Transfer',
        success: saveCategoriesExpense
    });
};


export const findColumnIndex = (grid, fieldName) => {
    const index = grid.columns.findIndex(column => column.field === fieldName);
    return index;
};
export const getBgColorForOperation = (state) => {
    if (state == 'none') return 'color: #333333';
    if (state == 'potential') return 'color: #3333BB';
    if (state == 'linked') return 'color: #33BB33';
    return 'color: #FF3333';
};

export const formatISOToDateTimeLocal = (isoString) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000; // Смещение в миллисекундах
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, -8); // Уберём секунды и миллисекунды
    return localISOTime;
  }