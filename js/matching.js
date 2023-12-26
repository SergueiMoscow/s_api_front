import { w2field, w2grid, query } from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax, backend } from '../js/common.js'
export let grid_bank;
export let grid_match;

const getOperationsURL = 'bank/operations'
// TODO: Убрать коммент + 1 из getMonth. Это только для разработки!!!
let month = (new Date()).getMonth() // + 1
let year = (new Date()).getFullYear()


const loadOperations = async () => {
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
        url: getOperationsURL,
        queryParams: queryParams,
        success: setRowsOperations
    })
    console.log('loadOperations')
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
            loadOperations()
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
            loadOperations()
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
            loadOperations()
            console.log(event.target.value);
        });
        grid_bank.columns[6].editable.items = response.categories.map(category => category.name)
        grid_bank.columns[7].editable.items = response.budgets.map(budget => budget.name)

    }

    setRowsOperations(response.operations)
    // debugger;
}

const loadData = () => {
    ajax({
        method: 'GET',
        url: getOperationsURL,
        success: setValues,
    })
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
        editable: { type: 'combo', items: categories, filter: true, align: 'left' },
    },
    {
        field: 'budget', text: 'Бюджет', size: '80px', sortable: true, resizable: true,
        editable: { type: 'combo', items: budgets, filter: true }
    },
    { field: 'notes', text: 'Детали', size: '120px', sortable: true, resizable: true },
    { field: 'account', text: 'Счёт', size: '80px', sortable: true, resizable: true },
]

const toolbar_op = {
    items: [
        { id: 'add', type: 'button', text: 'Add Record', icon: 'w2ui-icon-plus' },
        { type: 'break' },
        { type: 'button', id: 'showChanges', text: 'Show Changes' }
    ],
    onClick(event) {
        if (event.target == 'add') {
            let recid = grid_bank.records.length + 1
            this.owner.add({ recid });
            this.owner.scrollIntoView(recid);
            this.owner.editField(recid, 1)
        }
        if (event.target == 'showChanges') {
            showChanged()
        }
    }
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
]


const toolbar_match = {
    items: [
        { id: 'add', type: 'button', text: 'Add Record', icon: 'w2ui-icon-plus' },
        { type: 'break' },
        { type: 'button', id: 'showChanges', text: 'Show Changes' }
    ],
    onClick(event) {
        if (event.target == 'add') {
            let recid = grid_match.records.length + 1
            this.owner.add({ recid });
            this.owner.scrollIntoView(recid);
            this.owner.editField(recid, 1)
        }
        if (event.target == 'showChanges') {
            showChanged()
        }
    }
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
                'toolbarSave': true,
            },
            columns: columns_op,
            toolbar: toolbar_op,
            records: [],

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
        }
    })

    loadData()

    console.log('ready matching')
})

const getBgColorForOperation = (state) => {
    if (state == 'none') return 'color: #333333'
    if (state == 'potential') return 'color: #3333FF'
    return 'color: #FF3333'
}


const setRowsOperations = (response) => {
    console.time('setRowOperations')
    grid_bank.records = []

    if (response.operations && response.operations.length > 0) {
        const rowsToAdd = response.operations.map(operation => ({
            recid: operation.id,
            account: operation.account,
            operation_type: operation.operation_type,
            amount: operation.amount,
            count: operation.count,
            budget: operation.budget,
            notes: operation.notes,
            date: operation.date,
            bank_category: operation.category,
            w2ui: { style: getBgColorForOperation(operation.state) }
        }));

        grid_bank.add(rowsToAdd); // Добавить все записи за один раз
    }
    grid_bank.refresh()
    console.timeEnd('setRowOperations')
}

const setRowsMatching = (response) => {
    console.time('setRowsMatching')
    let counter = 1
    grid_match.records = []
    let rowsToAdd = []
    let children = []
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
                date: head.date,
                w2ui: {
                    style: 'color: #333333',
                    children: children,
                },
            });
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