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
        console.error(`Error getRecastAnalyse() | ${err}`);
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
        // Formato del objeto recibido en https://recast.ai/docs/api-reference/#request-text
        const response = await getRecastAnalyse(query.userMessage, query.locale);
        const data = response.data.results.intents[0];
        console.log("Intent '%s' | Confidence %s", data.slug, data.confidence);
        return {
            intent: data.slug,
            confidence: data.confidence,
        };
    } catch (err) {
        // Si Recast no encuentra el intento devuelve 'undefined'
        // "ReferenceError: intent is not defined at getIntent"
        console.error("Error getIntent() |", err); 
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
        if (intent.confidence > 0.4) {
            return await require('./database').getMessage(intent.intent);
        } else {
            return await require('./database').getMessage("ningun-intento");
        }
    } catch (err) {
        // Si getIntent() devuelve error, debido al 'undefined',
        // considedaremos el 'undefined' como "ningun-intento"
        console.log("Error getMessgeFromDatabase() |", err);
        return await require('./database').getMessage("ningun-intento");
    };
};

async function getFormattedMessages(query) {
    var data;
    try {
        data = await getMessageFromDatabase(query);
    } catch(err) {
        console.log("Error getFormattedMessage() - Part 1 |", err);
        data = err; 
    };

    try {
        var chatfuelMessage;
        const messagesNumber = data["Numero mensajes"];

        if (messagesNumber == 0) {
            chatfuelMessage = await require('./chatfuel').getChatfuelFormatGoToBlock(data);
            return chatfuelMessage;
        } else {
            chatfuelMessage = await require('./chatfuel').getChatfuelFormatMessages(data, messagesNumber, true);
            return chatfuelMessage;
        }
    } catch (err) {
        console.log("Error getFormattedMessage() - Part 2 |", err);
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
        userMessage: query['user_message'],
        locale: query['locale'],
    };

    try {
        const messages = await getFormattedMessages(query);
        console.log("Mensaje para Chatfuel:", JSON.stringify(messages));
        return messages;
    } catch(err) {
        console.log("Error getResponse() |", err);
    };
};