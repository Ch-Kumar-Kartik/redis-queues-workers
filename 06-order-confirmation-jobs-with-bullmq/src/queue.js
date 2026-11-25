/*
queue.js opens one BullMQ queue named "emails" and exports it, 
along with the Redis address
*/
import {Queue} from 'bullmq'

const connection = {
    host : 'localhost',
    port : 6379,
}

/*
connection is the Redis server BullMQ uses as its storage. 
It is your local Redis from Docker, on port 6379. 
BullMQ does not keep jobs in the Node process. It writes 
them in Redis, so they stay there if the API restarts.
*/

const emailQueue = new Queue('emails', {connection}) // The queue name is "emails". emailQueue is only the JavaScript variable that holds that queue.

/*
new Queue('emails', { connection }) creates the producer side of a q
ueue called "emails". The name is the shared label. api.js imports 
emailQueue and calls emailQueue.add(...), which stores a job under 
that name. The worker listens to the same name, "emails", using 
this same connection.

new Queue('emails', …) tells BullMQ to use a queue named emails. 
That string is what gets stored in Redis and what the worker must 
listen to. In worker.js the first argument is also "emails", so 
both sides refer to the same queue.

The two exports split those roles:

emailQueue is what the API uses to add jobs.
connection is what the worker uses to connect to Redis and pick 
those jobs up.
*/

export { emailQueue, connection }