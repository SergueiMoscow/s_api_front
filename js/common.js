import { backend } from './backend.js'

const getTokenFromSession = () => {
    return sessionStorage.getItem('access');
}

const showError = (message) => {
    console.log(message)
}

    export const ajax = async ({
        method,
        url,
        headers = {},
        body,
        success,
        queryParams = {},
        error = console.error,
        handleError = (message) => alert(message),
    } = {}) => {
        if (body instanceof FormData) {
            delete headers["Content-Type"];
        } else {
            if (!('Content-Type' in headers)) {
                headers["Content-Type"] = "application/json";
            }
            body = JSON.stringify(body);
        }
        const token = await getToken();

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers,
            credentials: "same-origin",
            body: body
        };

        const serializeQueryParams = params => {
            return Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');
        };

        let fullUrl = `${backend}/${url}`;
        const queryStr = serializeQueryParams(queryParams);

        // GET-запрос не должен содержать тело
        if (method.toUpperCase() === 'GET') {
            delete options.body;
            if (queryStr) {
                fullUrl += `?${queryStr}`;
            }
        }

        const response = fetch(`${fullUrl}`, options)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        alert(`${data.error.error_code}\n${data.error.error_message}`);
                    });
                }
                if (response.status == 200) {
                    return response.json();
                }
            })
            .then(data => success(data))
            .catch(e => {
                console.error('Error: ', e)
            });
    };


const base64UrlDecode = (str) => {
    // Заменяем символы '-' и '_' на соответствующие '+', '/'
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Добавляем символы '=', чтобы длина строки стала кратна 4
    base64 = base64.padEnd(base64.length + 4 - (base64.length % 4), '=');
    // Декодируем Base64 в строку
    return atob(base64);
}


// Функция для получения срока действия токена
const getTokenExpirationTime = (token) => {
    // Делаем предположение, что токен валиден и разделен на три части (header.payload.signature)
    const payload = token.split('.')[1];
    // Декодируем payload из Base64URL
    const decodedPayload = base64UrlDecode(payload);
    // Преобразуем JSON строку в объект
    const payloadObj = JSON.parse(decodedPayload);
    // Возвращаем значение поля `exp`
    return payloadObj.exp ? payloadObj.exp * 1000 : null;
}


const saveTokenFromResponse = (response) => {
    // debugger;
    sessionStorage.setItem('access', response.access);
    return response.access
}

const refreshToken = async function () {
    const refreshToken = sessionStorage.getItem('refresh');
    const options = {
        headers: {"Content-Type": "application/json"},
        method: 'POST',
        body: JSON.stringify({ "refresh": refreshToken }),
        credentials: "same-origin",
    }
    return await fetch(`${backend}/refresh/`, options)
    .then(response => {
        if (!response.ok) {
            throw new Error('Error refreshToken');
        }
        return response.json();
    })
    .then(data => saveTokenFromResponse(data))
    .catch(error => console.error('Error: ', error));
}

export const getToken = async function () {
    const accessToken = sessionStorage.getItem('access');
    if (accessToken) {
        const expirationTime = getTokenExpirationTime(accessToken);

        if (expirationTime) {
            const currentTime = Date.now();

            if (currentTime >= expirationTime) {
                // Токен истек, отправляем запрос на обновление 
                console.log("Токен истек! Нужно обновить.");
                await refreshToken()
                let newAccessToken = await refreshToken();
                // if (newAccessToken == accessToken) debugger;
                if (accessToken) {
                    console.log('Токен успешно обновлен');
                    return newAccessToken
                }
                console.log('Не удалось обновить токен')
                return null
            } else {
                // Токен еще действителен
                const timeLeft = (expirationTime - currentTime) / 1000;
                console.log(`Токен действителен еще ${timeLeft} секунд`);
            }
        }
        return accessToken
    }
    return accessToken
}


export const getRefresh = () => {
    return sessionStorage.getItem('refresh');
}

export const isLoggedIn = async () => {
    const accessToken = await getToken();
    // Предполагаем, что валидный токен Bearer обычно длиннее определенного количества символов, например, 20
    const validTokenLength = 228;

    console.log(`token length: ${accessToken ? accessToken.length : 0}`);
    return accessToken && accessToken.length === validTokenLength;
}


export const redirectTo = (url) => {
    window.location.href = `${backend}/{url}`
}


export const fillContent = (html, link) => {
    localStorage.setItem('lastMenu', link);
    $("#content").load(html)
}

export const updateMenuState = (activeLink) => {
    document.querySelectorAll('#menu-ul a.nav-link').forEach(a => {
        // Удаление активного класса со всех ссылок
        a.classList.remove('active');
        
        // Добавление класса active к текущему выбранному пункту меню
        if (a.getAttribute('href') === activeLink) {
            a.classList.add('active');
        }
    });
};

export const addOptionIfNotExist = (select, value, text) => {
    if (!Array.from(select.options).some(option => option.textContent === text)) {
        const option = new Option(text, value);
        select.add(option);
    }
}
