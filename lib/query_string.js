/**
 * Modulo con las funciones:
 *  - setIntentForChatfuel(intentName)
 *  - getIntentForChatfuel()
 *  - getRecastAnalyse(userMessage, locale) https://recast.ai/docs/structured-messages
 *  - getIntent(query)
 *  - getMessageFromDatabase(query)
 *  - (función pública) getResponse(request)
 *  - (función pública) getResponseFromAccordingToQuickReply
 */

'use strict';

var axios = require('axios');
const url = require('url');
if (process.env.NODE_ENV !== 'production') { // require('dotenv').config();
    // this put the environment variables = undefined https://github.com/RecastAI/SDK-NodeJS/issues/35
    require('dotenv').load();
};
var intentForChatfuel; // variable donde se guarda el nombre del intento de la expresión analizada.

/**
 * Función que guarda el nombre del intento de la expresión analizada.
 */
function setIntentForChatfuel(intentName) {
    intentForChatfuel = intentName;
};

/**
 * Función que devuelve el intento de la expresión analizada.
 */
function getIntentForChatfuel() {
    return intentForChatfuel;
};

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
        const data = response.data.results;
        // Devolver una matriz con solo los valores clave (o nombre principal) de cada entidad
        const entities = Object.keys(response.data.results.entities);

        console.log(`Intent: ${data.intents[0].slug} | Entities: ${entities} | Confidence: ${data.intents[0].confidence}`);
        
        return {
            slug: data.intents[0].slug,
            confidence: data.intents[0].confidence,
            entities: entities
        };
    } catch (err) {
        // Si Recast no encuentra el intento devuelve 'undefined'
        // "ReferenceError: intent is not defined at getIntent"
        console.error(`Error en getIntent() | ${err}`); 
    }
};

/**
 * Función para obtener el mensaje de la base de datos
 * en Airtable según el intento.
 */
async function getMessageFromDatabase(query) {
    var objectAirtable;

    try {
        const intent = await getIntent(query);
        if (intent.confidence > 0.35) {
            // Guardar valor del intento
            setIntentForChatfuel(intent.slug);

            // Si el intento se le tiene que tener en cuenta sus entidades, Airtable seguro
            // devolverá más de 1 fila para este intento.
            // Ejemplo de las filas de la tabla en Airtable:
            //  Fila #1: Intento='grado-general', Especifico='etsetb-grado-telecos'
            //  Fila #2: Intento='grado-general', Especifico='etsetb-grado-fisica'
            //  Fila #3: Intento='grado-general', Especifico='etsetb-grado-datos'
            if (intent.slug == "grado-descripcion" ||
                intent.slug == "grado-plan-estudios" ||
                intent.slug == "grado-general" ||
                intent.slug == "grado-curso-academico" ||
                intent.slug == "grado-salida-profesional" ||
                intent.slug == "grado-practicas-empresas") {
                var nombreEntitdadGrado = null;
                // Guardar entidad con nombre del grado del objecto 'entities' devuelto por Recast
                const grado = query.faculty.toLowerCase() + "-grado-";
                
                // Averiguar y guardar el nombre del grado '{{facultad}}-grado-{{nombre del grado}}' 
                // que se encuentra en la matriz 'entities'
                // https://www.w3schools.com/jsref/jsref_includes.asp
                for (var i = 0; i < intent.entities.length; i++) {
                    if ((intent.entities[i]).includes(grado)) {
                        nombreEntitdadGrado = intent.entities[i];
                    }
                };

                console.log("Nombre entidad del grado:", nombreEntitdadGrado);

                // En caso que no se encuentre la entidad grado (ex: 'etsetb-grado-telecos'),
                // no seguir el codigo y pedir.
                if (nombreEntitdadGrado == null) throw new Error("Ninguna entidad de grado especifico");

                // Como el intento "grado-plan-estudios" tiene multiples grados
                // se tiene que filtrar el objeto devuelto por Airtable y
                // escoger solo el que tiene el valor en la columna 'Especifico'
                // igual al nombre del grado que estamos buscando.
                const getArrayOfMessages = await require('./database').getArrayOfMessages(intent.slug);
                var getDatabaseIntents;
                var posicionObjectoDatabase = -1;
                for (i = 0; i < getArrayOfMessages.length; i++) {
                    // Obtener la posicion donde se encuentra la entidad '{facultad}-grado-[grado]'
                    // en la matriz 'entities' https://www.w3schools.com/jsref/jsref_includes.asp
                    if ((getArrayOfMessages[i].fields["Especifico"]).match(nombreEntitdadGrado)) {
                        posicionObjectoDatabase = i;
                        getDatabaseIntents = getArrayOfMessages[i].fields;
                    }
                };

                return getDatabaseIntents;
            } 
            // Se ejecuta cuando no es un intento que tenga distintos grados
            // Más información arriba en el comentario del 'if (...)'.
            else {
                // Airtable solo devolverá 1 fila de la tabla de Airtable.
                objectAirtable = await require('./database').getArrayOfMessages(intent.slug);
                
                return objectAirtable[0].fields;
            };
        } else {
            throw new Error("Intento < 0.35");
        }
    } catch (err) {
        console.error(`Error en getMessgeFromDatabase() | ${err}`);

        if (err.message === "Ninguna entidad de grado especifico") {
            // Si no se ha encuentrado la entidad grado (ex: 'etsetb-grado-telecos')...
            objectAirtable = await require('./database').getArrayOfMessages("error-ningun-grado-copy");

            return objectAirtable[0].fields;
        } else {
            // Si getIntent() devuelve error, debido al 'undefined',
            // consideraremos el 'undefined' como "ningun-intento"
            setIntentForChatfuel("error-ningun-intento");

            objectAirtable = await require('./database').getArrayOfMessages("error-ningun-intento");

            return objectAirtable[0].fields;
        };
    };
};

/**
 * Funcion para obtener el mensaje de Airtable formateado para que 
 * Chatfuel lo entienda
 */
async function getFormattedMessages(query) {
    var data;
    try {
        data = await getMessageFromDatabase(query);
    } catch(err) {
        // Se guarda el mensaje de la base de datos. Mirar el catch()
        // de getMessageFromDatabase()
        data = err; 
        console.error(`Error en getFormattedMessage() Part 1 | ${err}`);
    };

    try {
        return await require('./chatfuel').getChatfuelFormatMessages(data, data["Numero mensajes"]);
    } catch (err) {
        console.error(`Error en getFormattedMessage() Part 2 | ${err}`);
    }
};

/**
 * Función que devuelve el mensaje para enviar a Chatfuel ya formateado
 * según las especificaciones de Chatfuel, pero en formato objecto.
 */
module.exports.getResponse = async function (request) {
    console.log("Input query '%s'", JSON.stringify(request.query));

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
        faculty: query['faculty'],
        userMessage: query['user_message'],
        locale: query['locale'],
    };

    try {
        const messages = await getFormattedMessages(query);

        var messagesFilter = {
            "set_attributes":
                {
                    "user_message": query.userMessage,
                    "user_intent": getIntentForChatfuel()
                }
        };

        Object.assign(messagesFilter, messages);

        // Registrar mensaje en la consola del servidor remoto
        console.log("Mensaje para Chatfuel:", JSON.stringify(messagesFilter));

        return messagesFilter;
    } catch(err) {
        console.error(`Error en getResponse() | ${err}`);
    };
};

/**
 * Función que devuelve el mensaje para enviar a Chatfuel ya formateado
 * según las especificaciones de Chatfuel (sin pasar por el análisis NLP).
 */
module.exports.getResponseFromAccordingToQuickReply = async function (request) {
    console.log("Grado escogido '%s'", JSON.stringify(request.query));

    var query = url.parse(request.url, true).query;
    query = {
        faculty: query['faculty'],
        // Juntar pregunta del usuario con el nombre del grado y analizarlo todo otra vez.
        userMessage: `${query['user_message']} grau ${query['grado_escogido'].toLocaleLowerCase()}`,
        userIntent: query['user_intent'],
        gradoEscogido: query['grado_escogido'].toLocaleLowerCase()
    };
    
    try {
        // Procesar el mensaje completo
        const messages = await getFormattedMessages(query);

        return messages;
    } catch(err) {
        console.error(`Error en getResponse() | ${err}`);
    };
};