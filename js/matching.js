import { w2field, w2grid, query } from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax, addOptionIfNotExist } from '../js/common.js'
import { getCategoriesByType, findColumnIndex, getBgColorForOperation } from './budget_common.js';
export let grid_bank;
export let grid_match;

const getTransactionsURL = 'bank/transactions'
let month = (new Date()).getMonth()
let year = (new Date()).getFullYear()


const loadTransactions = async () => {
    const inputMonth = document.getElementById("month")
    const inputOperationType = document.getElementById("operation-types")
    const inputAccount = document.getElementById("accounts")
    const queryParams = {}
    if (inputMonth) {
        const parts = inputMonth.value.split('-')
        queryParams['year'] = parts[0]
        queryParams['month'] = parts[1]
    }
    if (inputOperationType) {
        queryParams['type'] = inputOperationType.value
    }
    if (inputAccount) {
        const selectedOption = inputAccount.options[inputAccount.selectedIndex]
        queryParams['account'] = selectedOption.text
    }
    await ajax({
        method: 'GET',
        url: getTransactionsURL,
        queryParams: queryParams,
        success: setRowsTransactions
    })
    console.log('loadTransactions')
}

const setValues = (response) => {
    const inputMonth = document.getElementById("month")
    const inputOperationType = document.getElementById("operation-types")
    const inputAccount = document.getElementById("accounts")

    if (inputMonth) {
        inputMonth.value = `${response.filter.year}-${String(response.filter.month).padStart(2, '0')}`
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
            loadTransactions()
            console.log(event.target.value);
        });
        const budgetColumnIndex = findColumnIndex(grid_bank, 'budget')
        grid_bank.columns[budgetColumnIndex].editable.items = response.budgets.map(budget => budget.name)

    }

    setRowsTransactions(response.transactions)
}

const loadData = () => {
    ajax({
        method: 'GET',
        url: getTransactionsURL,
        success: setValues,
    })
}

const updateGridForMatched = (response) => {
    console.log('updateGridForMatched response:')
    console.log(response)
    if (response.result) {
        response.result.forEach(el => {
            const row_bank = grid_bank.get(el.transaction_id)
            row_bank.state='linked'
            row_bank.w2ui.style=getBgColorForOperation(row_bank.state)
            grid_bank.refreshRow(el.transaction_id)
            requestMatching(el.transaction_id)
        })

    }
}

const getDataForMatchRequest = () => {
    // Собирает категорию, бюджет, детали, счёт для отправки request с добавлением CashFlow
    const selectedIds = grid_bank.getSelection();
    const changes = grid_bank.getChanges().filter(change => selectedIds.includes(change.recid));
    let category  = ''
    let budget = ''
    let notes = ''
    const inputAccount = document.getElementById('accounts')
    const account = inputAccount.options[inputAccount.selectedIndex].text

    const bank_selected = grid_bank.getChanges()
    bank_selected.forEach(row => {
        category = category.length > row.category?.text?.length ? category : row.category.text
        budget = (budget.length > row.budget?.text?.length ? budget : row.budget?.text) || ''
        notes = (notes.length > row.notes?.text?.length ? notes : row.notes) || ''
    })
    return {category: category, budget: budget, notes: notes, account: account}
}

const sendMatchRequest = (bank_id, match_id) => {
    console.log(bank_id, match_id)
    if (bank_id.length == 0) {
        return alert('В списке выписки должна быть выбран как минимум одна запись')
    }
    const cashFlowIds = [];
    match_id.forEach(el => {
        const item = grid_match.get(el);
        if (item) {
            if (item.ids !== '0') {
            // Если 'ids' не равен нулю, просто добавляем его в массив.
            cashFlowIds.push(parseInt(item.ids));
            } else {
            // Если 'ids' равен нулю, нужно искать 'ids' в 'children'.
            if (item.w2ui && item.w2ui.children) {
                // Перебираем всех 'children' и добавляем их 'ids' в массив.
                item.w2ui.children.forEach(child => {
                if (child && child.ids) {
                    cashFlowIds.push(parseInt(child.ids));
                }
                });
            }
            }
        }
    });
    
    const dataForMatchRequest = getDataForMatchRequest()

    console.log(cashFlowIds)
    ajax({
        method: "POST",
        url: "bank/matching",
        headers: {"Content-Type": "application/json"},
        body: {transaction_ids: bank_id, cashflow_ids: cashFlowIds, ...dataForMatchRequest},
        credentials: "same-origin",
        success: updateGridForMatched
    })
    // Firefox не работает стандатный input type='month'
    // $('#month').datepicker();
}

let budgets = []
let categories = []

const columns_op = [
    { field: 'recid', text: 'ID', size: '50px', sortable: true, resizable: true },
    { field: 'date', text: 'date', size: '80px', sortable: true, resizable: true },
    { field: 'operation_type', text: 'Тип', size: '80px', sortable: true, resizable: true },
    { field: 'amount', text: 'money', size: '80px', sortable: true, resizable: true, render: 'money' },
    { field: 'count', text: 'Кол.', size: '30px', sortable: true, resizable: true, render: 'int' },
    { field: 'bank_category', text: 'Кат.банка', size: '100px', sortable: true, resizable: true },
    {
        field: 'category', text: 'Категория', size: '100px', sortable: true, resizable: true,
        editable: { type: 'list', items: categories, filter: true, align: 'left', openOnFocus: true, },
        render(record, extra) {
            return extra.value?.text || '';
        }    
    },
    {
        field: 'budget', text: 'Бюджет', size: '80px', sortable: true, resizable: true,
        editable: { type: 'list', items: budgets, filter: true, openOnFocus: true, },
        render(record, extra) {
            return extra.value?.text || '';
        }    
    },
    { 
        field: 'notes', text: 'Детали', size: '120px', sortable: true, resizable: true, 
        editable: { type: 'text' },
    },
    { field: 'account', text: 'Счёт', size: '80px', sortable: true, resizable: true },
    { field: 'state', text: 'State', size: '5px', hidden: true },
]

const toolbar_op = {
    // items: [
    //     { id: 'add', type: 'button', text: 'Add Record', icon: 'w2ui-icon-plus' },
    //     { type: 'break' },
    //     { type: 'button', id: 'showChanges', text: 'Show Changes' }
    // ],
    // onClick(event) {
    //     if (event.target == 'add') {
    //         let recid = grid_bank.records.length + 1
    //         this.owner.add({ recid });
    //         this.owner.scrollIntoView(recid);
    //         this.owner.editField(recid, 1)
    //     }
    //     if (event.target == 'showChanges') {
    //         showChanged()
    //     }
    // }
}

const columns_match = [
    { field: 'recid', text: 'ID', size: '50px', sortable: true, resizable: true },
    { field: 'date', text: 'date', size: '80px', sortable: true, resizable: true },
    { field: 'account', text: 'account', size: '80px', sortable: true, resizable: true },
    { field: 'amount', text: 'money', size: '80px', sortable: true, resizable: true, render: 'money' },
    { field: 'count', text: 'Кол.', size: '30px', sortable: true, resizable: true, render: 'int' },
    { field: 'category', text: 'Категория', size: '100px', sortable: true, resizable: true },
    { field: 'notes', text: 'Заметки', size: '200px', sortable: true, resizable: true },
    { field: 'time', text: 'time', size: '80px', sortable: true, resizable: true },
    { field: 'ids', text: 'ids', size: '10px', sortable: false, resizable: false, hidden: true },
]


const toolbar_match = {
    items: [
        { id: 'match', type: 'button', text: 'Match', icon: 'w2ui-icon-plus' },
        { type: 'break' },
        { type: 'button', id: 'showChanges', text: 'Show Changes' }
    ],
    onClick(event) {
        if (event.target == 'match') {
            const bank_id = grid_bank.getSelection()
            const match_id = grid_match.getSelection()
            sendMatchRequest(bank_id, match_id)
        }
        if (event.target == 'showChanges') {
            showChanged()
        }
    }
}

const setBtnPreviousNextMonthHandler = () => {
    const previousMonthButton = document.getElementById('previousMonth')
    const nextMonthButton = document.getElementById('nextMonth')
    const selectMonth = document.getElementById('month')
    previousMonthButton.addEventListener('click', () => {
        const currentDate = selectMonth.valueAsDate
        currentDate.setMonth(currentDate.getMonth() - 1);
        selectMonth.valueAsDate = currentDate
        loadTransactions()
    })
    nextMonthButton.addEventListener('click', () => {
        const currentDate = selectMonth.valueAsDate
        currentDate.setMonth(currentDate.getMonth() + 1);
        selectMonth.valueAsDate = currentDate
        loadTransactions()
    })
}


$(document).ready(async () => {

    // EU Common el, Format
    new w2field('date', { el: query('input[type=eu-date]')[0], format: 'd.m.yyyy' })
    new w2field('date', { el: query('input[type=eu-dateA]')[0], format: 'd.m.yyyy', start: '5.' + month + '.' + year, end: '25.' + month + '.' + year })
    new w2field('date', { el: query('input[type=eu-dateB]')[0], format: 'd.m.yyyy', blockDates: ['12.' + month + '.' + year, '13.' + month + '.' + year, '14.' + month + '.' + year] })
    new w2field('date', { el: query('input[type=eu-date1]')[0], format: 'd.m.yyyy', end: query('input[type=eu-date2]')[0] })
    new w2field('date', { el: query('input[type=eu-date2]')[0], format: 'd.m.yyyy', start: query('input[type=eu-date1]')[0] })
    new w2field('time', { el: query('input[type=eu-time]')[0], format: 'h24' })
    new w2field('time', { el: query('input[type=eu-timeA]')[0], format: 'h24', start: '8:00 am', end: '4:30 pm' })
    new w2field('datetime', { el: query('input[type=eu-datetime]')[0], format: 'dd.mm.yyyy|h24:mm' })
    if ($('#grid-bank').length === 0) {
        console.error('Grid element #grid-bank not found.');
        return;
    }

    grid_bank = new
        w2grid({
            name: 'grid-bank',
            box: '#grid-bank',
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
            onReload: loadTransactions,

        });

    grid_match = new
        w2grid({
            name: 'grid-match',
            box: '#grid-match',
            show: {
                'toolbar': true,
                'footer': true,
                'toolbarSave': true,
            },
            columns: columns_match,
            toolbar: toolbar_match,
            records: [],

        });

    grid_bank.on('*', (event) => {
        // console.log(event)
        let recid = event.detail.recid ?? event.detail.clicked?.recid
        if (event.type == 'click') {
            const txt = 'rec: ' + recid
            console.log(txt)
            requestMatching(recid)
            // Подгружаем категории для выпадающего списка
            const transactionCategories = (grid_bank.get(recid).amount > 0 ? 'IncomeCategories' : 'ExpenseCategories')
            const categoryColumnIndex = findColumnIndex(grid_bank, 'category')
            grid_bank.columns[categoryColumnIndex].editable.items =
            JSON.parse(localStorage.getItem(transactionCategories))
            .map(category => category.name)
        }
    })
    getCategoriesByType()
    loadData()
    setBtnPreviousNextMonthHandler()

    console.log('ready matching')
})

const setRowsTransactions = (response) => {
    console.time('setRowTransactions')
    grid_bank.records = []

    if (response.transactions && response.transactions.length > 0) {
        const rowsToAdd = response.transactions.map(transaction => ({
            recid: transaction.id,
            account: transaction.account,
            operation_type: transaction.operation_type,
            amount: transaction.amount,
            count: transaction.count,
            budget: transaction.budget,
            notes: transaction.notes,
            date: transaction.date,
            bank_category: transaction.category,
            state: transaction.state,
            w2ui: { style: getBgColorForOperation(transaction.state) }
        }));

        grid_bank.add(rowsToAdd); // Добавить все записи за один раз
    }
    grid_bank.refresh()
    console.timeEnd('setRowTransactions')
}

const setRowsMatching = (response) => {
    console.time('setRowsMatching')
    let counter = 1
    grid_match.records = []
    let rowsToAdd = []
    let children = []
    let amount = 0
    let rowsToExpand = [] // Массив для хранения recid родительских записей
    if (response.match && response.match.length > 0) {
        for (const head of response.match) {
            for (const item of head.matched_by_time) {
                children.push({
                    recid: counter++,
                    account: item.account,
                    amount: item.amount,
                    count: item.count,
                    notes: item.notes,
                    category: item.category_name,
                    ids: item.ids,
                    date: new Date(item.time).toLocaleDateString(),
                    w2ui: { style: 'color: #333333' },
                });
            }
            let parentRecid = counter++; // Сохраняем recid родительской записи
            rowsToAdd.push({
                recid: parentRecid,
                account: head.account,
                amount: head.amount,
                count: head.count,
                notes: head.notes,
                category: head.category_name,
                ids: head.ids,
                date: head.date,
                w2ui: {
                    style: getBgColorForOperation(head.state),
                    children: children,
                },
            });
            amount += head.amount
            if (children.length > 0) {
                rowsToExpand.push(parentRecid); // Добавляем recid для разворачивания
            }
        }
        grid_match.add(rowsToAdd.flat());
    }
    rowsToExpand.forEach(recid => grid_match.expand(recid));
    grid_match.refresh()
    console.timeEnd('setRowsMatching')
}

const requestMatching = (operationId) => {
    ajax({
        method: 'GET',
        url: 'bank/matching',
        queryParams: {'id': operationId, 'days': 2},
        success: setRowsMatching,
    })
}