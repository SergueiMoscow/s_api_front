import { w2field, w2grid} from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax } from '../js/common.js'
import { getCategoriesByType } from './budget_common.js';

export let gridOperations;

const loadOperations = () => {

}

const loadData = () => {
    ajax({
        method: 'GET',
        url: 'operation/'
    })
}

const columns_op = [

]
const toolbar_op = [

]
document.addEventListener('DOMContentLoaded', (event) => {
// $(document).ready(async () => {

    gridOperations = new
    w2grid({
        name: 'grid-operations',
        box: '#grid-operations',
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
        onReload: loadOperations,

    });
    getCategoriesByType()
    loadData()

    console.log('DocumentReady')
})
