export const backend = 'http://127.0.0.1:8000'

const getTokenFromSession = () => {
    return sessionStorage.getItem('access');
}

export const ajax = async ({
    method,
    url,
    headers = {},
    body,
    success,
    queryParams = {},
    error = console.error
} = {}) => {
    headers["Content-Type"] = "application/json";
    const token = getTokenFromSession();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        credentials: "same-origin",
        body: body ? JSON.stringify(body) : undefined
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
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => success(data))
        .catch(error => console.error('Error: ', error));
};


export const ajaxOld = async (method, endpoint, headers = {}, body, success, queryString_ = {}, error = console.error) => {
    headers["Content-Type"] = "application/json"
    const token = getTokenFromSession()
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }
    const options = {
        method: method,
        headers: headers,
        credentials: "same-origin",
        body: body ? JSON.stringify(body) : undefined
    };

    const serializeQueryParams = params => {
        return Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
    };
    const queryString = serializeQueryParams(queryParams);

    // GET-запрос не должен содержать тело
    if (method.toUpperCase() === 'GET') {
        delete options.body;
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const response = fetch(`${backend}/${endpoint}`, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => success(data))
        .catch(error => console.error('Error: ', error));

}

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
    return sessionStorage.setItem('access', response.access);
}

const refreshToken = async function () {
    const refreshToken = sessionStorage.getItem('refresh');
    return await ajax({
        method: 'POST',
        url: 'refresh/',
        body: { "refresh": refreshToken },
        success: saveTokenFromResponse,
    })
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
                let newAccessToken = sessionStorage.getItem('access');
                // if (newAccessToken == accessToken) debugger;
                if (accessToken) {
                    return accessToken
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


export const fillContent = (html) => {
    $("#content").load(html)
}