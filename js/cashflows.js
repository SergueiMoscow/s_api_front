import { w2ui, w2grid } from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax } from './common.js'
import { getCategoriesByType, findColumnIndex, getBgColorForOperation, formatISOToDateTimeLocal } from './budget_common.js';

export let gridCashFlows;

let budgets = []
let categories = []


const updateCashFlowGrid = (response) => {
    console.log(response)
}

const loadCashFlows = () => {
    const filter = {
        date_begin: document.getElementById('date-begin').value,
        date_end: document.getElementById('date-end').value,
        category_ids: [],
        operation_type: document.getElementById('operation-types').value,
    }
    let budget = document.getElementById('budgets').value
    if (budget !== '') filter['budget'] = budget
    let account = document.getElementById('accounts').value
    if (account !== '') filter['account'] = account


    ajax({
        method: 'GET',
        url: 'budget/cashflow/',
        queryParams: filter,
        success: setRowsCashflow,
    })
}

const saveColumnSize = (grid) => {
    const sizes = {}
    grid.columns.forEach(col => {
        sizes[col.field] = col.size
    })
    localStorage.setItem(grid.name, JSON.stringify(sizes))
    console.log('saveColumnSize')
}

const restoreColumnSize = (grid) => {
    const sizesStr = localStorage.getItem(grid.name);
    if (sizesStr) {
        const sizes = JSON.parse(sizesStr);
        grid.columns.forEach(col => {
            if (sizes[col.field] != null) {  // Проверка наличия сохраненного размера для колонки
                col.size = sizes[col.field];
            }
        });
    }
    console.log('restoreColumnSize');
}

const setRowsCashflow = (response) => {
    console.time('setRowCashflows')
    const cashflows = response.cashflows
    gridCashFlows.records = []

    const getFullCategoryName = (category) => {
        if (!category || !category.parent) {
            return category ? category.name : '';
        }
        const parentCategory = JSON.parse(localStorage.getItem('categories'))[category.parent];
        return parentCategory ? `${parentCategory.name} / ${category.name}` : category.name;
    }

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
            category: getFullCategoryName(el.category),
            state: el.linked ? 'linked' : 'none',
            w2ui: { style: getBgColorForOperation(el.linked ? 'linked' : 'none') }
        }));

        gridCashFlows.add(rowsToAdd); // Добавить все записи за один раз
    }
    gridCashFlows.refresh()
    console.timeEnd('setRowCashflows')
}


const saveCategoriesToLocalStorage = (response) => {
    const categories = response.categories;
    const categoriesObject = {};
    categories.forEach(category => {
        categoriesObject[category.id] = {
            name: category.name,
            is_income: category.is_income,
            is_expense: category.is_expense,
            is_transfer: category.is_transfer,
            children: category.children,
        };
    });
    localStorage.setItem('categories', JSON.stringify(categoriesObject));
}

const fillCategory1Select = () => {
    const category1Select = document.getElementById('edit-category1');
    const categoriesObject = JSON.parse(localStorage.getItem('categories'));
    
    // Очищаем предыдущие options, если они были
    category1Select.innerHTML = '';

    // Теперь нам нужно использовать Object.entries для перебора
    for (const [id, categoryDetails] of Object.entries(categoriesObject)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = categoryDetails.name;
        category1Select.appendChild(option);
    }
}

const setValues = (response) => {
    const inputDateBegin = document.getElementById("date-begin")
    const inputDateEnd = document.getElementById("date-end")
    const inputOperationType = document.getElementById("operation-types")
    const inputAccount = document.getElementById("accounts")
    const inputBudget = document.getElementById("budgets")

    const editBudget = document.getElementById('edit-budget')
    const editAccount = document.getElementById('edit-account')
    const editCategory = document.getElementById('edit-category')

    const addOptionIfNotExist = (select, value, text) => {
        if (!Array.from(select.options).some(option => option.textContent === text)) {
            const option = new Option(text, value);
            select.add(option);
        }
    }

    if (inputDateBegin) {
        inputDateBegin.value = `${response.filter.date_begin}`
        inputDateBegin.addEventListener('change', (event) => {
            loadCashFlows()
            console.log(`inputDateBegin ${event.target.value}`);
        });
    }

    if (inputDateEnd) {
        inputDateEnd.value = `${response.filter.date_end}`
        inputDateEnd.addEventListener('change', (event) => {
            loadCashFlows()
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
            loadCashFlows()
            console.log(`inputOperationType ${event.target.value}`);
        });
    }
    if (inputAccount && editAccount) {
        response.accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.id;
            option.textContent = account.name;

            // Устанавливаем активный элемент, если ID совпадает с переменной response.filter.account
            if (account.name === response.filter.account) {
                option.selected = true;
            }
            inputAccount.appendChild(option);
            editAccount.appendChild(option)
        });
        // добавить обработчик события на изменение выбранного элемента в select
        inputAccount.addEventListener('change', (event) => {
            loadCashFlows()
            console.log(event.target.value);
        });

        const categoryColumnIndex = findColumnIndex(gridCashFlows, 'category')
        gridCashFlows.columns[categoryColumnIndex].editable.items = response.categories.map(category => category.name)

        const budgetColumnIndex = findColumnIndex(gridCashFlows, 'budget')
        gridCashFlows.columns[budgetColumnIndex].editable.items = response.budgets.map(budget => budget.name)

        gridCashFlows.onColumnResize = function (event) {
            saveColumnSize(this)
        }
    }

    if (inputBudget && editBudget) {
        response.budgets.forEach(budget => {
            const option = document.createElement("option");
            option.value = budget.id;
            option.textContent = budget.name;

            // Устанавливаем активный элемент, если ID совпадает с переменной response.filter.account
            if (budget.name === response.filter.budget) {
                option.selected = true;
            }
            inputBudget.appendChild(option);
            editBudget.appendChild(option);

        });
        // добавить обработчик события на изменение выбранного элемента в select
        inputBudget.addEventListener('change', (event) => {
            loadCashFlows()
            console.log(event.target.value);
        });

    }
    saveCategoriesToLocalStorage(response)
    fillCategory1Select()
    setRowsCashflow(response)
}

const loadData = () => {
    ajax({
        method: 'GET',
        url: 'budget/initialize',
        success: setValues,
    })
}

const setSelectedValue = (selectElement, valueToSelect) => {
    for (const option of selectElement.options) {
        if (option.text === valueToSelect) {
            selectElement.value = option.value;
            break;
        }
    }
}


const setSelectedCategory = (fullCategoryName) => {
    const categoriesStr = localStorage.getItem('categories');
    const categories = JSON.parse(categoriesStr);
    const editCategory1 = document.getElementById('edit-category1');
    const editCategory2 = document.getElementById('edit-category2');
    
    editCategory2.innerHTML = '';

    // 1. Разделяем полное название категории на parent и child.
    const [parentName, childName] = fullCategoryName.split(' / ');

    // 2. Находим parent category.
    let parentId = null;
    for (let id in categories) {
        if (categories[id].name === parentName) {
            parentId = id;
            editCategory1.value = parentId; // Предполагаем, что значения соответствуют id категорий.
            break;
        }
    }

    // 3. Если есть дочерние категории, добавляем их в editCategory2.
    if (parentId && categories[parentId].children) {
        categories[parentId].children.forEach(child => {
            let option = document.createElement('option');
            option.value = child.id;
            option.textContent = child.name;
            editCategory2.appendChild(option);

            // Добавляем дочерний элемент, если он совпал с указанным в fullCategoryName
            if (childName && child.name === childName) {
                editCategory2.value = child.id; // Присваиваем id, который уже является значением в option.
            }
        });

        if (childName) {
            editCategory2.style.display = 'block'; // Показываем editCategory2, если есть дочерняя категория
        } else {
            editCategory2.style.display = 'none'; // Скрываем, если дочерней нет.
        }
    } else {
        // Скрываем editCategory2, если у parent нет дочерних категорий
        editCategory2.style.display = 'none';
    }
};


const loadSelectedToForm = (recid) => {
    const title = document.getElementById('edit-title')
    const record_ids = gridCashFlows.getSelection()
    title.innerHTML = `${record_ids.length} selected`
    const editId = document.getElementById('edit-id')
    const editTime = document.getElementById('edit-time')
    const editType = document.getElementById('edit-type')
    const editAmount = document.getElementById('edit-amount')
    const editBudget = document.getElementById('edit-budget')
    const editAccount = document.getElementById('edit-account')
    const editCategory = document.getElementById('edit-category')
    const editNotes = document.getElementById('edit-notes')
    // Инициализируем div с checkbox для возможности мультиEdit
    const editCashflowForm = document.querySelector('form#editCashflow');
    const col1Divs = editCashflowForm.querySelectorAll('div.col-1');

    if (record_ids.length === 1) {
        const record = gridCashFlows.get(record_ids[0])
        editId.value = record.recid
        editTime.value = formatISOToDateTimeLocal(record.time)
        editType.value = record.operation_type
        editAmount.value = record.amount
        setSelectedValue(editBudget, record.budget)
        setSelectedValue(editAccount, record.account)
        // setSelectedValue(editCategory, record.category)
        setSelectedCategory(record.category)
        editNotes.value = record.notes

        col1Divs.forEach(div => {
            div.style.display = 'none';
        });        
    }
    if (record_ids.length > 1) {
        col1Divs.forEach(div => {
            div.style.display = 'block';
        });        
    }
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
const toolbarCashflow = {
    items: [
        { id: 'editDiv', type: 'check', text: 'Edit'},
        { type: 'break' },
        { type: 'button', id: 'showChanges', text: 'Show Changes' }
    ],
    onClick(event) {
        if (event.target == 'editDiv') {
            const listCashflowDiv = document.getElementById('list-cashflow');
            const editCashflowDiv = document.getElementById('edit-cashflow');

            if (event.object.checked) {
                listCashflowDiv.className = "col-12";
                editCashflowDiv.style.display = "none";
                editCashflowDiv.className = "";
            } else {
                listCashflowDiv.className = "col-8";
                editCashflowDiv.style.display = "block";
                editCashflowDiv.className = "col-md-4 col-lg-4 order-md-last";
            }
            console.log('EditDiv')
            console.log(event)
        }
    }
}

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
                'toolbarSave': true,
                selectColumn: true
            },
            columns: columnsCashflow,
            toolbar: toolbarCashflow,
            records: [],
            advanceOnEdit: false,
            onReload: loadCashFlows,
        });
    gridCashFlows.on('select', (event) => {
        setTimeout(() => {
            const selectedRecords = event.owner.getSelection();
            console.log('Selected records after onSelect:', selectedRecords);
            loadSelectedToForm()
          }, 0);
          
        // let recid = event.detail.recid ?? event.detail.clicked?.recid
        // if (event.type == 'click') {
        //     const txt = 'rec: ' + recid
        //     console.log(txt)
        //     loadSelectedToForm(recid)
        // }
    })
    // gridCashFlows.onSelect = (event) => {
    //     console.log(`OnSelect`)
    //     console.log(event.execute)
    //     console.log(event.owner.getSelection())
    //     // loadSelectedToForm
    // }


    getCategoriesByType()
    loadData()
    restoreColumnSize(gridCashFlows)
    console.log('DocumentReady')
})
