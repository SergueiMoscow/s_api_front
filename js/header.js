import { isLoggedIn, ajax, redirectTo, updateMenuState, fillContent } from './common.js'
window.fillContent = fillContent

const logout = async () => {
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('refresh');
    redirectTo('login/')
};


const viewHeaderComponents = async () => {
    const login = document.getElementById('login-div')
    const logout = document.getElementById('logout-div')
    const search = document.getElementById('search-form')
    const userIsLoggedIn = await isLoggedIn()
    login.style.display=(userIsLoggedIn ? 'none' : 'block')
    logout.style.display=(userIsLoggedIn ? 'block' : 'none')
    if (search)
    {
        search.style.display=(userIsLoggedIn ? 'block' : 'none')
    }
}

const createMenu = async (response) => {
    const items = response.items
    const current = response.current
    const menu = document.getElementById('menu-ul')
    if (menu) {
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = `nav-link px-2 ${item.id === current ? 'link-secondary' : ''}`;
            if (item.link) {
                a.href = item.link;
            } else {
                a.href='#'
                a.addEventListener('click', () => {
                    fillContent(`${item.html}.html`, item.html);
                });
            }
            a.innerHTML = `${item.caption}`;
            if (item.icon) {
                const icon = document.createElement('i');
                icon.className = item.icon;
                // Можно добавить иконку перед текстом, либо после
                a.prepend(icon); // Добавить иконку перед текстом
                // a.appendChild(icon); // Добавить иконку после текста
            }
            li.appendChild(a);
            menu.appendChild(li);
        });
    }
}

const getMenu = async () => {
    await ajax({
        method: 'GET',
        url: 'users/menu/',
        body: {},
        success: createMenu,
    })
}

$( document ).ready(async () => {
    $("#btn-login").click(async function(){
        window.location.href = '/login.html'
    })
    $("#btn-logout").click(async function(){
        await logout()
    })

    viewHeaderComponents();
    getMenu();
    const lastMenu = localStorage.getItem('lastMenu');
    
    if (lastMenu) {
        updateMenuState(lastMenu); // Обновите состояние меню
        fillContent(`${lastMenu}.html`, lastMenu); // Загрузите содержимое
    }    
    console.log( "ready header" );
});

