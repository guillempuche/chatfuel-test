/**
 * Formatear el mensaje de la databse a los requerimientos de Chatfuel
 * Funciones:
 *  - getChatfuelFormat(message)
 * 
 * Formato JSON en Chatfuel: http://docs.chatfuel.com/plugins/plugin-documentation/json-api
 * 
 */

/**
 * Función que devuelve un objeto con el valor del item data["go-to-block"].
 */
module.exports.getChatfuelFormatGoToBlock = function getChatfuelFormatGoToBlock(data) {
    return {
        "redirect_to_blocks": [ data["go-to-block"] ]
    };
}

/**
 * Función que crea una matriz con los multiples mensajes (ex: mensaje #1, #2... go-to-block 
 * que recibe de la database de un solo intento. El texto de estos mensajes se añade en
 * una matriz 'messages'. FInalmente, se añade el objeto "go-to-block" (en caso de que haya datos
 * en data["go-to-block"]).
 */
module.exports.getChatfuelFormatMessages = function getChatfuelFormatMessages(data, messagesNumber, goToBlock) {
    // Crear un arrey con el numero de mensajes de texto y se añade uno extra
    // para una imagen + 'go-to-block'. Despues se rellena cada espacio con '0'.
    // Ex: Array(3) == [0,0,0]. Ex: Array(4) == [#1, #2, Imagen]
    // *IMPORTANTE: go-to-block no está añade dentro de 'messages[]'
    var messages = new Array(messagesNumber).fill(0);

    // Si la matriz 'data' contiene 2 mensajes de la database = 2 items con nombre #1 (que es el 1r mensaje)
    // y #2 (que es el 2o mensaje), se añaden el valor de estos 2 items (que serà en formato texto)
    // a una matriz 'messages' que junta todos los mensajes.
    for (var i = 1; i <= messagesNumber; i++) {
        // Escribir entre "" el nombre de las variables de Chatfuel,
        // sino puede que no funcione
        messages[i-1] = {
            "text": data[`#${i}`],
        };
    };

    // Si existe una url de una imagen añadir a la siguiente posicion de 'messages[]'
    if (data["Imagen"] != (null || undefined)) {
        // Añadir a la última posición de la matriz el objeto 'go-to-block'
        messages[messagesNumber] = {
            "attachment": {
                "type": "image",
                "payload": {
                    "url": data["Imagen"]
                }
            },
        };
    }
    // En caso que 'data' tenga un valor 'go-to-block' se devuelve 'return' con redireccion a un bloque de Chatfuel.
    // *IMPORTANTE: NO se añade el item "go-to-block" a 'messages[]'
    if (data["go-to-block"] != (null || undefined)) {
        return { 
            messages,
            "redirect_to_blocks": [ data["go-to-block"] ]
        };
    } else {
        return { messages };
    }
};