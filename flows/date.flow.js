const { addKeyword, EVENTS } = require("@bot-whatsapp/bot");
const { text2iso, iso2text } = require("../scripts/utils")
const { isDateAvailable, getNextAvailableSlot } = require("../scripts/calendar")
const { chat } = require("../scripts/chatgpt")

const { formFlow } = require("./form.flow");
//const { content } = require("googleapis/build/src/apis/content");

const promptBase =`Eres un asistente virtual diseñado para ayudar a los usuarios a agendar citas mediante una conversación.

Tu objetivo es únicamente asistir al usuario a elegir una fecha y hora para programar una cita.

Te proporcionaré la fecha solicitada por el usuario y la disponibilidad de la misma. Esta fecha debe ser confirmada por el usuario.

Si la disponibilidad es true, responde con algo como:
"La fecha solicitada está disponible. El turno sería el jueves 30 de mayo de 2024 a las 10:00 horas."

Si la disponibilidad es false, recomienda la siguiente fecha disponible (te dejo dicha información al final del mensaje). Por ejemplo, si la siguiente fecha disponible es el jueves 30, responde así:
"La fecha y horario solicitados no están disponibles. Te puedo ofrecer el jueves 30 de mayo de 2024 a las 11:00 horas."

Bajo ninguna circunstancia realices consultas adicionales.

En lugar de simplemente decir que la disponibilidad es falsa, envía una disculpa indicando que la fecha no está disponible y ofrece la siguiente opción.

Al final, encontrarás los estados actualizados de las fechas disponibles.

`;

const confirmationFlow = addKeyword(EVENTS.ACTION)
.addAnswer("¿Cofirmas la fecha propuesta? Responde unicamente con 'si' o 'no'", { capture: true },
    async(ctx, ctxFn) =>{
        if (ctx.body.toLowerCase().includes("si")){
            return ctxFn.gotoFlow(formFlow)
        }else{
            await ctxFn.endFlow("Reserva cancelada. Vuelve a solicitar una reserva para elegir otra.")
        }
    })


const dateFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¡Perfecto! ¿Que fecha quieres agendar?", { capture: true })
    .addAnswer("Revisando disponibilidad...", null,
        async(ctx, ctxFn)=>{
           const currentDate = new Date();
           const solicitedDate= await text2iso(ctx.body)
           //console.log("Fecha solicitada" + solicitedDate)
           if (solicitedDate.includes("false")){
           return ctxFn.endFlow("No se pudo deducir una fecha. Dime una fecha.")
           }
           const startDate = new Date(solicitedDate);
           
           let dateAvailable = await isDateAvailable(startDate)

           if (dateAvailable === false){
            const nextdateAvailable = await getNextAvailableSlot(startDate)

            const isoString = nextdateAvailable.start.toISOString();
            const dateText = await iso2text(isoString)

            const messages = [{ role:"user", content:`${ctx.body}`}];
            const response = await chat(promptBase + "\nHoy es el dia: " + currentDate + "\nLa fecha solicitada es: " + solicitedDate + "\nLa disponibilidad de esa fecha es: false. El Proximo espacio disponible posible que tienes que ofrecer es: " + dateText + "Da la fecha siempre en español", messages)
            await ctxFn.flowDynamic(response)
            await ctxFn.state.update({ date: nextdateAvailable.start });
            return ctxFn.gotoFlow(confirmationFlow)

           } else {
            const messages = [{ role:"user", content:`${ctx.body}`}];
            const response = await chat(promptBase + "\nHoy es el dia: " + currentDate + "\nLa fecha solicitada es: " + solicitedDate + "\nLa disponibilidad de esa fecha es: true" + "\nConfirmación del cliente: No confirmo", messages)
            await ctxFn.flowDynamic(response)
            await ctxFn.state.update({ date: startDate });
            return ctxFn.gotoFlow(confirmationFlow)
           }

        })

        module.exports = { dateFlow , confirmationFlow };