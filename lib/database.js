/**
 * Módulo con las funciones:
 *  - getMessage(intent)
 * 
 * ALERTA: Airtable tiene un máximo de 5 request/sec. Si se excede a esto:
 * error 409 + 30 sec par enviar-se la request.
 *      https://airtable.com/appLDeeXZrnvuL4h6/api/docs#curl/introduction
 */

const axios = require('axios');
if (process.env.NODE_ENV !== 'production') { // require('dotenv').config();
    // this put the environment variables = undefined https://github.com/RecastAI/SDK-NodeJS/issues/35
    require('dotenv').load();
};

/**
 * Función que devuelve la fila de la database en https://airtable.com/tblTHzJNhKUJE71xN/viwE752zvG4AT56xn
 * que el valor de la columna 'Intento' coincide con el intento 'intent' enviado.
 * Devuelve el mensaje en formato original de la database según el intento damos.
 * Ejemplo de JSON devuelto por Airtable:
    {
        "records": [
            {
                "id": "recTgWHhE9gqDXnPt",
                "fields": {
                    "Mensaje": "Vols fer l'enquesta?",
                    "Nombre": "encuesta",
                    "Intento": "general-encuesta",
                    "Notes": "Ir a dialogo encuesta"
                },
                "createdTime": "2018-03-20T12:11:00.000Z"
            }
        ]
    }
 */
module.exports.getMessage = function getMessage(intent){
    return axios.get(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_APP_ID}/Dialogos?filterByFormula=FIND("${intent}",{Intento})`,
        { 
            headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } 
        }
    ).then(data => {
        // console.log(JSON.stringify(data.data.records[0].fields.Mensaje));
        return data.data.records[0].fields.Mensaje;
    }).catch(err => {
        console.log(err);
    })
};


