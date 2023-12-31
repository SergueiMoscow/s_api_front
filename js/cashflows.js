import { w2field, w2grid} from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax } from './common.js'
import { getCategoriesByType, findColumnIndex } from './budget_common.js';

export let gridCashFlows;

const loadCashFlows = () => {

}


const setValues = (response) => {
    const inputMonth = document.getElementById("month")
    const inputOperationType = document.getElementById("operation-types")
    const inputAccount = document.getElementById("accounts")

    const addOptionIfNotExist = (select, value, text) => {
        if (!Array.from(select.options).some(option => option.textContent === text)) {
            const option = new Option(text, value);
            select.add(option);
        }
    }

    if (inputMonth) {
        inputMonth.value = `${response.filter.year}-${response.filter.month}`
        inputMonth.addEventListener('change', (event) => {
            loadTransactions()
            console.log(`inputMonth ${event.target.value}`);
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

        });
        // добавить обработчик события на изменение выбранного элемента в select
        inputAccount.addEventListener('change', (event) => {
            loadCashFlows()
            console.log(event.target.value);
        });
        categoryColumnIndex = findColumnIndex(gridCashFlows, 'category')
        gridCashFlows.columns[7].editable.items = response.budgets.map(budget => budget.name)

    }

    setRowsTransactions(response.transactions)
}

const loadData = () => {
    ajax({
        method: 'GET',
        url: 'budget/initialize',
        success: setValues,
    })
}

const columns_op = [

]
const toolbar_op = [

]
$(document).ready(async () => {

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
        columns: columns_op,
        toolbar: toolbar_op,
        records: [],
        advanceOnEdit: false,
        onReload: loadCashFlows,

    });
    getCategoriesByType()
    loadData()

    console.log('DocumentReady')
})
