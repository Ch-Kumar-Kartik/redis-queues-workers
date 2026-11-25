// publisher
import express from 'express'
import Redis from 'ioredis'

const app = express()
app.use(express.json())

// One Redis process (the instance). REDIS_URL, or localhost:6379 by default.
// subscriber.js opens its own TCP connection to this same server.
// "notifications" is not a second Redis instance and not a stored key.
// It is a channel: a topic name inside this server, like a room.
// Redis has no CREATE CHANNEL. The name exists only because publish and
// subscribe use the same string. It must match subscriber.js exactly
// (subscribe('notifications')). A typo silently delivers to nobody.
// Many channels can live on this one server at once.
const publisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

// Publisher side of Redis pub/sub. This route does not talk to subscribers
// and does not write the notification into Redis storage.
// Pub/sub is a live handoff: Redis copies the string onto every connection
// that has already subscribed. If subscriber.js is not running, receivers
// is 0 and the payload is dropped. A subscriber started afterward sees nothing.
// Run two copies of subscriber.js and one POST reaches both, because both
// are listening at that instant.
//
// Route path has no leading slash, so Express will not match POST /notifications.
app.post("notifications", async (req, res) => {
    // express.json() above already parsed the body into req.body.
    // title comes from the client, or "default title" when it is missing.
    // createdAt is stamped here so every subscriber sees the same send time.
    const payload = {
        title : req.body.title || "default title",
        createdAt : new Date().toISOString(),
    }
    // Pub/sub messages are strings, so the object is serialized.
    // publish returns how many clients received it (the subscriber count).
    // GET notifications would find nothing; this does not create a key.
    const receivers = await publisher.publish("notifications", JSON.stringify(payload))
    res.json({message: `Notification sent to ${receivers} subscribers`})
})

app.listen(3000, () => {
    console.log("API server is running on port http://localhost:3000")
})