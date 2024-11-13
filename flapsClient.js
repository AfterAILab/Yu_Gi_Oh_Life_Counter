async function getMain(url) {
    const response = await fetch(`${url}/main`);
    const data = await response.json();
    return data;
}

async function setMain(url, data) {
    const response = await fetch(`${url}/main`, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return response.json();
}

async function updateText(url, text) {
    const data = await getMain(url);
    return await setMain(url, { ...data, text });
}

module.exports = {
    getMain,
    setMain,
    updateText
}