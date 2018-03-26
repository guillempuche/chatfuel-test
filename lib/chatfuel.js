/**
 * Formatear el mensaje de la databse a los requerimientos de Chatfuel
 * Funciones:
 *  - getChatfuelFormat(message)
 * 
 * Formato JSON en Chatfuel: http://docs.chatfuel.com/plugins/plugin-documentation/json-api
 * 
 */

module.exports.getChatfuelFormat = function getChatfuelFormat(data) {
    // Escribir entre "" el nombre de las variables de Chatfuel,
    // sino puede que no funcione
    if (data["go-to-block"] == null) {
        return {
            "messages": [
                {
                    "text": data.Mensaje,
                }
            ]
        };
    } else if (data["go-to-block"] != "") {
        return {
            "redirect_to_blocks": ["ayuda"]
        };
    }

};