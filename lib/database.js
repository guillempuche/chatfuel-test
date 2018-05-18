/**
 * Módulo con las funciones:
 *  - (función pública) getArrayOfMessages(intent)
 * 
 * ALERTA: Airtable tiene un máximo de 5 request/sec. Si se excede a esto:
 * error 409 + 30 sec par enviar-se la request.
 *      https://airtable.com/appLDeeXZrnvuL4h6/api/docs#curl/introduction
 */

'use strict';

const axios = require('axios');
if (process.env.NODE_ENV !== 'production') { // require('dotenv').config();
    // this put the environment variables = undefined https://github.com/RecastAI/SDK-NodeJS/issues/35
    require('dotenv').load();
};

/** 
 * Función que devuelve las filas de la base de datos que el valor de
 * la columna 'Intento' coincide con el intento 'intent' enviado.
 * 
 * Ejemplo de las filas de la tabla en Airtable:
        Fila #1: Intento='grado-general', Especifico='etsetb-grado-telecos'
        Fila #2: Intento='grado-general', Especifico='etsetb-grado-fisica'
        Fila #3: Intento='grado-general', Especifico='etsetb-grado-datos'
        ...
 *
 * Ejemplo de JSON devuelto por Airtable (puede cambiar algunos de estos dataos,
 * comprobarlo en Airtable.com):
 *     {
 *         "records": [
 *             {
                "id": "recTgWHhE9gqDXnPt",
                "fields": {
                    "Intento": "grado-plan-estudios",
                    "Especifico": "etset-grado-telecos",
                    "Numero mensajes": 2,
                    "#1": "Este es el mensaje 1.",
                    "#2": "Este es el mensaje 2.",  
                    "go-to-block": ,
                    ...                  
                },
                "createdTime": "2018-03-20T12:11:00.000Z"
            }
        ]
    }
 * 
 * Más información sobre el API de Airtable en https://airtable.com/{codigo_app}/api/docs
 */
module.exports.getArrayOfMessages = function (intent){
    return axios.get(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_APP_ID}/Dialogos?filterByFormula=FIND("${intent}",{Intento})`,
        { 
            headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } 
        }
    ).then(data => {
        return data.data.records;
    }).catch(err => {
        console.error(err);
    })
};