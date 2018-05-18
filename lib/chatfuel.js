/**
 * Formatear el mensaje de la base de datos a los requerimientos de Chatfuel
 * 
 * Funciones:
 *  - (función pública) getChatfuelFormatMessages(data, messagesNumber)
 * 
 * Más información: formato JSON en Chatfuel en http://docs.chatfuel.com/plugins/plugin-documentation/json-api
 * 
 */

'use strict';

/**
 * Función que crea una matriz con los multiples mensajes (ex: mensaje #1, #2... go-to-block 
 * que recibe de la database de un solo intento. El texto de estos mensajes se añade en
 * una matriz 'messages'. FInalmente, se añade el objeto "go-to-block" (en caso de que haya datos
 * en data["go-to-block"]).
 */
module.exports.getChatfuelFormatMessages = function (data, messagesNumber) {
    // Si hay 1 o más mensajes se procesa esta condición.
    if (messagesNumber != 0) {
        /*
        'messageFormatted' se usa para guardar todo los mensajes... que se deben enviar.
        La estructura de 'messageFormatted' puede resultar ser:
        {
            "messages": [
                {
                    "text": "..."
                },
                "attachment": {
                    "type": "image",
                    "payload": {
                        "url": "..."
                    }
                },
                {
                    "text": "...",
                    "quick_reply": [..] // en el caso de que no haya ningun 'go-to-block'
                },
            ],
            "redirect_to_blocks": "..." // en el caso de que no haya ningun 'quick-reply'
        }
        La matriz 'messages[]' puede tener: multiples objetos de mensajes de texto,
        1 objeto para 1 imagen y 1 objeto con 2 objetos para 'quick-reply'.

        IMPORTANTE:
        - 'go-to-block' no se añade dentro de 'messages[]'
        - 'quick-reply' que tiene 2 objetos (título + lista botones) se añade 
        al final de 'messages[]' porque los botones de 'quick-reply'
        deben estar al final de los mensajes.
        */

        var messageFormatted = { "messages": {} };
        // Ex: Array(3) == [0,0,0]. Ex: Array(4) == [#1, #2, Imagen, #quick-reply]
        messageFormatted.messages = new Array(messagesNumber).fill(0);
    
        // Si la matriz 'data' contiene 2 mensajes de la database = 2 items con nombre #1 (que es el 1r mensaje)
        // y #2 (que es el 2o mensaje), se añaden el valor de estos 2 items (que serà en formato texto)
        // a una matriz 'messages' que junta todos los mensajes.
        for (var i = 1; i <= messagesNumber; i++) {
            // Escribir entre "" el nombre de las variables de Chatfuel,
            // sino puede que no funcione
            messageFormatted.messages[i-1] = {
                "text": data[`#${i}`],
            };
        };
    
        // Si existe una url de una imagen añadir a la siguiente posicion de 'messages[]'
        if (data["Imagen"] != null ||
            data["Imagen"] != undefined) {
            // Añadir a la última posición de la matriz el objeto 'go-to-block'
            messageFormatted.messages.push({
                "attachment": {
                    "type": "image",
                    "payload": {
                        "url": data["Imagen"]
                    }
                },
            });
        };

        // En caso que 'data' tenga un valor 'go-to-block' se devuelve 'return' con redireccion a un bloque de Chatfuel.
        // *IMPORTANTE: NO se añade el item "go-to-block" a 'messages[]'
        if (data["go-to-block"] != null ||
            data["go-to-block"] != undefined) {
            const messages = messageFormatted.messages;
            messageFormatted = { 
                messages,
                "redirect_to_blocks": [ data["go-to-block"] ]
            };
        };

        // Ejecutar esto si no hay ningun 'go-to-block', pero si hay un 'quick-reply'.
        if (data["quick-reply"] != null ||
            data["quick-reply"] != undefined) {
            // Añadir los 2 objetos de 'quick-reply' como uno nuevo en la matriz 'messages' 
            const quickReply = JSON.parse(data["quick-reply"]);
            messageFormatted.messages.push({
                "text": quickReply.text,
                "quick_replies": quickReply.quick_replies
            });    
        };
        
        return messageFormatted;
    } else {
        // Se prioriza el 'go-to-block' antes que el 'quick-reply'.
        if (data["go-to-block"] != null ||
            data["go-to-block"] != undefined) {
            return {
                "redirect_to_blocks": [ data["go-to-block"] ]
            };
        }
        // Solo si hay un 'quick-reply', se ejecuta la siguiente condición.
        else if (data["quick-reply"] != null ||
            data["quick-reply"] != undefined) {
            return {
                "messages": [ JSON.parse(data["quick-reply"]) ]
            };
        };
    };
};