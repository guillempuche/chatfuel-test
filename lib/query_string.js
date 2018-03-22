/**
 * Modulo con las funciones:
 *  - getRecastAnalyse(userMessage, locale) https://recast.ai/docs/structured-messages
 *  - getIntent(query)
 *  - getMessageFromDatabase(query)
 *  - getMessageFromDatabase(query)
 *  - getResponse(request)
 */

var axios = require('axios');
const url = require('url');
if (process.env.NODE_ENV !== 'production') { // require('dotenv').config();
    // this put the environment variables = undefined https://github.com/RecastAI/SDK-NodeJS/issues/35
    require('dotenv').load();
};

/*********** FUNCIONES ******************* */
/**
 * Función que devuelve el intento del mensaje del usuario (integra Recast.ai)
 */
async function getRecastAnalyse(userMessage, locale) {
    try {
        // Analyse text https://recast.ai/docs/api-reference/#analyse-endpoints
        return await axios.post('https://api.recast.ai/v2/request',
            {
                text: userMessage,
                // Recast tiene que ser: https://www.iso.org/iso-639-language-codes.html
                language: 'ca',
            },
            {
                headers: { Authorization: `Token ${process.env.RECAST_REQUEST_TOKEN}` }
            })
    } catch(err) {
        console.error(`Recast API Request | ${err}`);
    };
};

/**
 * Función que:
 *  1. Analiza el mensaje del usuario enviandolo a Recastl
 *  2. Devuelve el nombre del intento
 * 
 * 2 modos de crear un funcion getIntent() asincrona.
 * Y así que no tener errores de en el orden de execución
 * al recibir antes los datos. Ejemplo erronio:
 *      $ var response = require('./query_string').getIntent(userMessage, locale);
 *      $ console.log(response); // undefined
 */
// Ejemplo correcto con: Async/Await https://github.com/axios/axios#example
async function getIntent(query) {
    try {
        const response = await getRecastAnalyse(query.userMessage, query.locale);
        console.log("Intento:", response.data.results.intents[0].slug);
        return {
            intent: response.data.results.intents[0].slug,
            confidence: response.data.results.intents[0].confidence,
        }
    } catch (err) {
        console.error("getIntent() |", err);
    }
};
// Ejemplo correcto con: Promise simple
// Si se debuga el codigo al devolcer el valor 'data', el programa hace
// un paso más comparador con Async/Await que no se el porque
/*
function getIntent() {
    require('./query_string').getIntent(userMessage, locale)
    .then((data) => {
        console.log(data);
        return res.json(data);
    })
    .catch((err) => {
        console.error(`Error en obtener | ${err}`);
    });
};
 */
async function getMessageFromDatabase(query) {
    try {
        const intent = await getIntent(query);
        const message = await require('./database').getMessage(intent.intent);
        return message;
    } catch (err) {
        console.log("getMessgeFromDatabase() |", err);
    }

};

async function getFormattedMessage(query) {
    try {
        const message = await getMessageFromDatabase(query);
        return await require('./chatfuel').getChatfuelFormat(message);
    } catch (err) {
        console.log("getFormattedMessage() |", err);
    }
};

/**
 * Función que devuelve el mensaje para enviar a Chatfuel ya formateado
 * según las especificaciones de Chatfuel, pero en formato objecto y no JSON.
 * 
 * TIP para entender como exportar módulo: Referenciar a una función: b = a().
 * 'b' referencia a la función a() y ahora puede llamarla: b().
 */
module.exports.getResponse = async function getResponse(request) {
    console.log("Index.js | Input query '%s'", JSON.stringify(request.query));

    /**
     * req.url() or req.originalUrl is a combination of req.baseUrl + req.path
     *      http://expressjs.com/en/4x/api.html#req.originalUrl
     * url.parse(urlStr, [parseQueryString], [slashesDenoteHost])
     * Take a URL string, and return an object.
     * Pass true as the second argument to also parse the query string
     * using the querystring module. Defaults to false.
     */
    var query = url.parse(request.url, true).query;
    query = {
        // userName: query['user_name'],
        userMessage: query['user_message'],
        locale: query['locale'],
    }

    function getQuery(userMessage, locale) {
        return { userMessage: userMessage, locale: locale};
    };

    try {
        const message = await getFormattedMessage(query);
        console.log(JSON.stringify(message));
        return message;
    } catch(err) {
        console.log(err);
    };
};