import express from 'express'
import Redis from 'ioredis'

const app = express()
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const QUEUE_KEY = 'queue:emails'

app.post('/emails', async (req, res) => {
    const job = {
        to : req.body.to, 
        subject : req.body.subject || 'No subject',
        body : req.body.body || 'No Content',
        createdAt : new Date().toISOString(), 
    }
    await redis.lpush(QUEUE_KEY, JSON.stringify(job))
    res.json({queued: true, job})
})

app.get('/emails/process-one', async (req, res) => {
    const rawJob = await redis.rpop(QUEUE_KEY)
    if (!rawJob) {
        return res.json({message: 'No jobs in queue', job})
    }
})

app.listen(3000, () => {
    console.log("server is listening at 3000")
})

/*
ISSUES :
Job Loss: Once a job is removed from the queue via RPOP, it is gone from Redis. If the server crashes or the email fails to send, the job is lost forever.
No Retry Mechanism: Because the job is removed upon being popped, there is no system in place to automatically re-attempt tasks that fail.
No Parallel Workers: The current manual implementation does not support background or parallel workers, limiting the system's ability to handle multiple tasks efficiently.
*/