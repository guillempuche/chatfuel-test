/**
 * Iniciar programa: $ npm start
 * Vigilar a la hora de iniciar el programa desdel terminal, puede no iniciar las variables .env
 *      INCORRECTO (en el directorio 'test': $ node .\index_test.js
 *      CORRECTO (en el directorio principal: $ node .\test\index_test.js
 * Si se inicia este fichero desdel Debugger, avisar al IDE de las variables .env
 */

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
 * 1. Procesar mensaje recibido de Chatfuel
 * 2. Enviar a Chatfuel el mensaje de respuesta via 'res' o response' en formato JSON
 *
 * Ejemplos URL:
 * https://recastai-test.glitch.me/chatfuel?fb_user={{messenger user id}}&user_language={{language}}&user_message={{queryString}}
 * https://6c439cd4.ngrok.io/chatfuel?user_name={{first name}}&user_language={{language}}&user_message={{queryString}}
 * http://localhost:5000/chatfuel?fb_user=447664558686462&user_language=ca&user_message=cancelar%20operacio
 */
app.get('/chatfuel', (req, res) => {

    /**
     * Función que devuelve el objecto intento. Es asincrona para que durante
     * la ejecución del Promise en Recast.ai se espera a que este Promise devuelve
     * el intento y luego lo asigne a la variable 'res'. Así no se ejecuta antes 'res'.
     */
    async function getMessage() {
        try {
            res.json(await require('./query_string').getResponse(req));
        } catch(err) {
            console.log(err);
        }
    };

    getMessage();
});

app.listen(PORT, () => console.log(`App started on port ${PORT}`));

