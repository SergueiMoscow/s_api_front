import { w2field, w2grid, query } from '../w2ui/js/w2ui-2.0.es6.js'
import { ajax, addOptionIfNotExist } from '../js/common.js'

const loadAccountsList = async (response) => {
    const accountsSelect = document.getElementById('accounts')
    response.results.forEach(el => {
        addOptionIfNotExist(accountsSelect, el.id, el.name)
    })
}

const getAccounts = ajax({
    method: 'GET',
    url: 'budget/moneystorage/',
    success: loadAccountsList,

})

const onBtnSendClick = () => {
    const destinationControl = document.getElementById('destination')
    const accountsControl = document.getElementById('accounts')
    const fileControl = document.getElementById('formFile')
    const formData = new FormData();
    if (!destinationControl || !accountsControl || !fileControl) {
        console.error('One or more elements are not found!');
        return;
    }

    formData.append('file', fileControl.files[0]);
    formData.append('destination', destinationControl[destinationControl.selectedIndex].text);
    if (accountsControl.selectedIndex >= 0) {
        formData.append('account', accountsControl[accountsControl.selectedIndex].text);
    } else {
        formData.append('account', '');
    }
    
    ajax({
        method: 'POST',
        url: 'budget/upload/',
        body: formData,
        success: responseHandler,
    })
}

const responseHandler  = () => {

}

const btnSendHandler = () => {
    const btnSend = document.getElementById('send')
    if (!btnSend) return;

    btnSend.removeEventListener('click', onBtnSendClick);
    btnSend.addEventListener('click', onBtnSendClick)
}

$(document).ready(async () => {
    btnSendHandler()
})