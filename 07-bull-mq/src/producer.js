const {Queue} = require('bullmq')
const notificationQueue = new Queue("email-queue", {
    connection: {
        host: '127.0.0.1',
        port: '6379'
    }
})

async function init() {
    const res = await notificationQueue.add("email to kartik", {
        email: "kartik.dev",
        subject: "welcome msg",
        body: "hey kartik, welcome",
    })

    console.log("job added to queue", res.id)
}

init();