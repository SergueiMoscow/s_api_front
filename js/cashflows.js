import { w2ui, w2grid } from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax } from './common.js'
import { getCategoriesByType, findColumnIndex, getBgColorForOperation } from './budget_common.js';

export let gridCashFlows;

let budgets = []
let categories = []

const loadCashFlows = () => {

}

const setRowsCashflow = (cashflows) => {
    console.time('setRowCashflows')
    gridCashFlows.records = []

    if (cashflows && cashflows.length > 0) {
        const rowsToAdd = cashflows.map(el => ({
            recid: el.id,
            account: el.money_storage.name,
            operation_type: el.operation_type,
            amount: el.amount,
            count: el.count,
            budget: el.budget.name,
            notes: el.notes,
            time: el.time,
            category: el.category.name,
            state: el.linked ? 'linked' : 'none',
            w2ui: { style: getBgColorForOperation(el.linked ? 'linked' : 'none') }
        }));

        gridCashFlows.add(rowsToAdd); // Добавить все записи за один раз
    }
    gridCashFlows.refresh()
    console.timeEnd('setRowCashflows')
}

const setValues = (response) => {
    const inputDateBegin = document.getElementById("date-begin")
    const inputDateEnd = document.getElementById("date-end")
    const inputOperationType = document.getElementById("operation-types")
    const inputAccount = document.getElementById("accounts")
    const inputBudget = document.getElementById("budgets")

    const addOptionIfNotExist = (select, value, text) => {
        if (!Array.from(select.options).some(option => option.textContent === text)) {
            const option = new Option(text, value);
            select.add(option);
        }
    }

    if (inputDateBegin) {
        inputDateBegin.value = `${response.filter.date_begin}`
        inputDateBegin.addEventListener('change', (event) => {
            loadTransactions()
            console.log(`inputDateBegin ${event.target.value}`);
        });
    }

    if (inputDateEnd) {
        inputDateEnd.value = `${response.filter.date_end}`
        inputDateEnd.addEventListener('change', (event) => {
            loadTransactions()
            console.log(`inputDateEnd ${event.target.value}`);
        });
    }

    if (inputOperationType) {
        addOptionIfNotExist(inputOperationType, "All", "All");
        response.operation_types.forEach((type) => {
            addOptionIfNotExist(inputOperationType, type, type);
        });
        if (response.filter.operation_type) {
            inputOperationType.value = response.filter.operation_type;
        } else {
            inputOperationType.value = "All"; // Установить All, если operation_type равен null.
        }
        inputOperationType.addEventListener('change', (event) => {
            loadTransactions()
            console.log(`inputOperationType ${event.target.value}`);
        });
    }
    if (inputAccount) {
        response.accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.id;
            option.textContent = account.name;

            // Устанавливаем активный элемент, если ID совпадает с переменной response.filter.account
            if (account.name === response.filter.account) {
                option.selected = true;
            }
            inputAccount.appendChild(option);
            // добавить обработчик события на изменение выбранного элемента в select
            inputAccount.addEventListener('change', (event) => {
                loadCashFlows()
                console.log(event.target.value);
            });

        });

        const categoryColumnIndex = findColumnIndex(gridCashFlows, 'category')
        gridCashFlows.columns[categoryColumnIndex].editable.items = response.categories.map(category => category.name)

        const budgetColumnIndex = findColumnIndex(gridCashFlows, 'budget')
        gridCashFlows.columns[budgetColumnIndex].editable.items = response.budgets.map(budget => budget.name)

    }

    if (inputBudget) {
        response.budgets.forEach(budget => {
            const option = document.createElement("option");
            option.value = budget.id;
            option.textContent = budget.name;

            // Устанавливаем активный элемент, если ID совпадает с переменной response.filter.account
            if (budget.name === response.filter.budget) {
                option.selected = true;
            }
            inputBudget.appendChild(option);
            // добавить обработчик события на изменение выбранного элемента в select
            inputBudget.addEventListener('change', (event) => {
                loadCashFlows()
                console.log(event.target.value);
            });

        });
    }
    setRowsCashflow(response.cashflows)
}

const loadData = () => {
    ajax({
        method: 'GET',
        url: 'budget/initialize',
        success: setValues,
    })
}

const columnsCashflow = [
    { field: 'recid', text: 'ID', size: '50px', sortable: true, resizable: true },
    { field: 'time', text: 'time', size: '80px', sortable: true, resizable: true },
    { field: 'operation_type', text: 'Тип', size: '80px', sortable: true, resizable: true },
    { field: 'amount', text: 'money', size: '80px', sortable: true, resizable: true, render: 'money' },
    { field: 'count', text: 'Кол.', size: '30px', sortable: true, resizable: true, render: 'int' },
    {
        field: 'category', text: 'Категория', size: '100px', sortable: true, resizable: true,
        editable: { type: 'list', items: categories, filter: true, align: 'left', openOnFocus: true, },
        render(record, extra) {
            return extra.value || '';
        }
    },
    {
        field: 'budget', text: 'Бюджет', size: '80px', sortable: true, resizable: true,
        editable: { type: 'list', items: budgets, filter: true, openOnFocus: true, },
        render(record, extra) {
            return extra.value || '';
        }
    },
    {
        field: 'notes', text: 'Детали', size: '120px', sortable: true, resizable: true,
        editable: { type: 'text' },
    },
    { field: 'account', text: 'Счёт', size: '80px', sortable: true, resizable: true },
    { field: 'state', text: 'State', size: '5px', hidden: true },

]
const toolbarCashflow = [

]
$(document).ready(async () => {
    if (w2ui['grid-cashflows']) {
        w2ui['grid-cashflows'].destroy();
    }
    gridCashFlows = new
        w2grid({
            name: 'grid-cashflows',
            box: '#grid-cashflows',
            show: {
                'toolbar': true,
                'footer': true,
                'toolbarSave': false,
                'toolbarAdd': false,
                'toolbarEdit': false,
            },
            columns: columnsCashflow,
            toolbar: toolbarCashflow,
            records: [],
            advanceOnEdit: false,
            onReload: loadCashFlows,

        });
    getCategoriesByType()
    loadData()

    console.log('DocumentReady')
})
