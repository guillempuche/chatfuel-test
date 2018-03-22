/**
 * Formatear el mensaje de la databse a los requerimientos de Chatfuel
 * Funciones:
 *  - getChatfuelFormat(message)
 * 
 * Formato JSON en Chatfuel: http://docs.chatfuel.com/plugins/plugin-documentation/json-api
 * 
 */

module.exports.getChatfuelFormat = function getChatfuelFormat(message) {
    return {
        text: message,
    };

};