const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')

const { dateFlow } = require("./flows/date.flow")
const { formFlow } = require("./flows/form.flow")
const { welcomeFlow } = require("./flows/welcome.flow")


/** Una vez que se active el flow principal va a crear una 
 * función que se va a ejercutar con los parametros:
 * @param ctx :: contexto actual
 * @param ctxFn :: funciones que podemos usar dentro del chatbot
 */


const flowPrincipal = addKeyword(EVENTS.WELCOME)

    .addAction(async (ctx, ctxFn) => {
        const bodyText = ctx.body.toLowerCase();
        // ¿El usuario está saludando?
        const keywords = ["hola", "buenas", "ola"];
        const containsKeyword = keywords.some(keyword => bodyText.includes(keyword));
        if (containsKeyword && ctx.body.length < 8) {
            return await ctxFn.gotoFlow(welcomeFlow) //Si, está saludando
        }// No, no está saludando

        // ¿EL usuario quiere agendar una Cita?
        const keywordsDate = ["agendar", "cita", "reunion", "turno"];
        const containsKeywordDate = keywordsDate.some(keyword => bodyText.includes(keyword));
        if (containsKeywordDate) {
            return ctxFn.gotoFlow(dateFlow); // Si quiere agendar una Cita.
        }else{
            return ctxFn.endFlow("No te entiendo");
        }
    });


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal, dateFlow, formFlow, welcomeFlow])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()

/* const solicitedDate = await text2iso(ctx.body)
        console.log("Fecha solicitada: " + solicitedDate)

        if (solicitedDate.includes("false")) {
            return ctxFn.endFlow("No se pudo deducir una fecha. Volver a preguntar")

        }

        let startDate = new Date(solicitedDate);
        console.log("Start Date: " + startDate)

        let dateAvailable = await isDateAvailable(startDate)
        console.log("Is Date Available: " + dateAvailable)

        if (dateAvailable === false){
            const nextdateAvailable = await getNextAvailableSlot(startDate)
            console.log("Fecha recomendada:" + nextdateAvailable.start)
            startDate = nextdateAvailable.start
        }

        const eventName = "Prueba Chatbot";
        const description = "Prueba Desc";
        const date = startDate;
        const eventId = await createEvent(eventName, description, date)
        


        
         const prompt = "Eres un chatbot diseñado para responder preguntas";
         const text = ctx.body;
 
         const conversations = [];
         //Crear el contexto con las conversaciones
         const contextMessages = conversations.flatMap(conv => [
             { role: "user", content: conv.question },
             { role: "assistant", content: conv.answer },
 
         ]);
 
         //Añadir la pregunta actual al contexto
         contextMessages.push({ role: "user", content: text });
 
         //Obtener la repuesta de ChatGPT
         const response = await chat(prompt, contextMessages);
 
         //Enviar la respuesta al usuario
         await ctxFn.flowDynamic(response);
        **/
