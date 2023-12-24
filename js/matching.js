import { w2field, w2grid, query } from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax, backend } from '../js/common.js'

let month = (new Date()).getMonth() + 1
let year = (new Date()).getFullYear()

const fillAccounts = () => {

}

const setValues = (response) => {
    debugger;
}

const loadData = () => {
    ajax('GET', 'bank/matching', {}, null, setValues)
}

let budgets = []
let categories = []

export const columns = [
    { field: 'recid', text: 'ID', size: '50px', sortable: true, resizable: true },
    { field: 'operation_type', text: 'Тип', size: '80px', sortable: true, resizable: true},
    { field: 'amount', text: 'money', size: '80px', sortable: true, resizable: true, render: 'money'},
    { field: 'count', text: 'Кол.', size: '20px', sortable: true, resizable: true, render: 'int'},
    { field: 'category', text: 'Категория', size: '100px', sortable: true, resizable: true,
        editable: { type: 'list', items: categories, showAll: true, openOnFocus: true, align: 'left' },
        render(record, extra) {
            return extra.value?.text || '';
        }
    },
    { field: 'budget', text: 'Бюджет', size: '150px', sortable: true, resizable: true,
        editable: { type: 'combo', items: budgets, filter: true }
    },
    { field: 'notes', text: 'Детали', size: '120px', sortable: true, resizable: true},
]

export const toolbar = {
    items: [
        { id: 'add', type: 'button', text: 'Add Record', icon: 'w2ui-icon-plus' },
        { type: 'break' },
        { type: 'button', id: 'showChanges', text: 'Show Changes' }
    ],
    onClick(event) {
        if (event.target == 'add') {
            let recid = grid.records.length + 1
            this.owner.add({ recid });
            this.owner.scrollIntoView(recid);
            this.owner.editField(recid, 1)
        }
        if (event.target == 'showChanges') {
            showChanged()
        }
    }
}

// let grid = null;

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
    loadData()
    if ($('#grid-bank').length === 0) {
        console.error('Grid element #grid-bank not found.');
        return;
    }

    let grid_bank = new 
    w2grid({
        name: 'grid-bank',
        box: '#grid-bank',
        show: {
            'toolbar': true,
            'footer': true,
            'toolbarSave': true,
        },
        columns: columns,
        toolbar: toolbar,
        records: [],
    
    });
    console.log('ready matching')
})
