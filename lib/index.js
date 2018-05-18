/**
 * Iniciar programa: $ npm start
 * Vigilar a la hora de iniciar el programa desdel terminal, puede no iniciar las variables .env
 *      INCORRECTO (en el directorio 'test': $ node .\index_test.js
 *      CORRECTO (en el directorio principal: $ node .\test\index_test.js
 * Si se inicia este fichero desdel Debugger, avisar al IDE de las variables .env
 */

'use strict';

const express = require('express');
if (process.env.NODE_ENV !== 'production') { // require('dotenv').config();
    // this put the environment variables = undefined https://github.com/RecastAI/SDK-NodeJS/issues/35
    require('dotenv').load();
    // require('dotenv').config({path: __dirname + '/.env'})
};
const PORT = process.env.PORT;

// Setting up our server
var app = express();

/**
 * Función que devuelve el objecto intento. Es asincrona para que durante
 * la ejecución del Promise en Recast.ai se espera a que este Promise devuelve
 * el intento y luego lo asigne a la variable 'res'. Así no se ejecuta antes 'res'.
 */
async function getMessage(req, res) {
    try {
        if (req.path == "/chatfuel/main")
            return res.json(await require('./query_string').getResponse(req));
        else if (req.path == "/chatfuel/gradoescogido")
            return res.json(await require('./query_string').getResponseFromAccordingToQuickReply(req));
    } catch (err) {
        console.error(`Error en index.js | ${err}`);
    }
};

/**
 * 1. Procesar mensaje recibido de Chatfuel
 * 2. Enviar a Chatfuel el mensaje de respuesta via 'res' o 'response' en formato JSON
 *
 * Ejemplos de URLs:
 * https://universitat-test.herokuapp.com/chatfuel/main?user_name={{first name}}&user_message={{queryString}}&faculty={{facultad}}&user_language={{language}}
 * http://localhost:5000/chatfuel/main?user_name={{first name}}&user_message={{queryString}}&faculty={{facultad}}&user_language={{language}}
 */
app.get('/chatfuel/main', (req, res) => {
    res = getMessage(req, res);
});

/**
 * Hay alguna información que el bot necesita saber el nombre del grado.
 * Si el usuario no lo ha escrito, la URL '.../chatfuel/main' le enviará una 'quick-reply'
 * para que seleccione el grado que quiere. Después Chatfuel le
 * reenviará a esta URL '.../chatfuelgradoescogido'. Aquí se
 * recolectará la información y se devolverá al usuario.
 * 
 * Ejemplo de URL:
 * https://universitat-test.herokuapp.com/chatfuel/gradoescogido?faculty={{facultad}}&user_message={{user_message}}&user_intent={{user_intent}}&grado_escogido={{grado_escogido}}
 * https://ac52abe3.ngrok.io/chatfuel/gradoescogido?faculty={{facultad}}&user_message={{user_message}}&user_intent={{user_intent}}&grado_escogido={{grado_escogido}}
 */
app.get('/chatfuel/gradoescogido', (req, res) => {
    res = getMessage(req, res);
});

app.listen(PORT, () => console.log(`App started on port ${PORT}`));