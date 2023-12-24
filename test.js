// Функция для декодирования Base64URL в строку
function base64UrlDecode(str) {
    // Заменяем символы '-' и '_' на соответствующие '+', '/'
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Добавляем символы '=', чтобы длина строки стала кратна 4
    base64 = base64.padEnd(base64.length + 4 - (base64.length % 4), '=');
    // Декодируем Base64 в строку
    return atob(base64);
}

// Функция для получения срока действия токена
function getTokenExpirationTime(token) {
    // Делаем предположение, что токен валиден и разделен на три части (header.payload.signature)
    const payload = token.split('.')[1];
    // Декодируем payload из Base64URL
    const decodedPayload = base64UrlDecode(payload);
    // Преобразуем JSON строку в объект
    const payloadObj = JSON.parse(decodedPayload);
    // Возвращаем значение поля `exp`
    return payloadObj.exp ? payloadObj.exp * 1000 : null;
}

// Используйте функцию:
function test() {
    const accessToken = sessionStorage.getItem('access'); // Подставьте реальный ключ для получения токена
    if (accessToken) {
        const expirationTime = getTokenExpirationTime(accessToken);

        if (expirationTime) {
            const currentTime = Date.now();

            if (currentTime >= expirationTime) {
                // Токен истек, отправляем запрос на обновление 
                console.log("Токен истек! Нужно обновить.");
            } else {
                // Токен еще действителен
                const timeLeft = (expirationTime - currentTime) / 1000;
                console.log(`Токен действителен еще ${timeLeft} секунд`);
            }
        }
    }

}
test()
