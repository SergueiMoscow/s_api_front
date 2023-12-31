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
