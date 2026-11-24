import express from 'Express'
import redis from 'Redis'

const app = express()
app.use(express.json())

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// String commands act on the whole value at a key.
// Hash commands act on named fields inside one key.
//
// SET key value        replace the entire string. A later SET throws away the previous value.
// GET key              read that whole string, or null if the key is missing.
// DEL key              delete the key, whether it holds a string or a hash.
// EXISTS key           1 if the key exists, 0 if it does not. It does not look inside a hash.
//
// HSET key field value set one field and leave the other fields in place.
// HGET key field       read one field, or null if that field is missing.
// HGETALL key          read every field. An empty object means the key is missing.
// HDEL key field       delete one field. The key remains while any field is left.
// HEXISTS key field    1 if that field exists, 0 if it does not.
//                      A hash can pass EXISTS and still fail HEXISTS for a missing field.
//
// Hash values are always strings. SET/GET here store one JSON string and parse it in the app.
// HSET/HGETALL store each body property as its own field, so one field can change without rewriting the rest.

app.post("/user/:id/json", async(req, res) => {
    // SET replaces the whole profile. Sending only { name } drops email and every other field.
    await redis.set(`user:${req.params.id}:json`, JSON.stringify(req.body))
    res.json({savedAs : "json"})
})

app.get("/user/:id/json", async(req, res) => {
    // GET returns one string. JSON.parse rebuilds the object. There is no command to read one JSON property.
    const raw = await redis.get(`user:${req.params.id}:json`)
    res.json({user : raw ? JSON.parse(raw) : null})
})

app.post("/user/:id/hash", async (req, res) => {
    // HSET writes each property as a field. Sending { name } updates name and keeps email.
    // HDEL would remove one field: redis.hdel(key, "email")
    await redis.hset(`user:${req.params.id}:hash`, req.body)
    res.json({savedAs : "hash"})
})

app.get("/user/:id/hash", async (req, res) => {
    // HGETALL returns every field. HGET would return one: redis.hget(key, "name")
    // EXISTS checks the key. HEXISTS checks a field: redis.hexists(key, "name")
    // DEL removes the key and every field. HDEL removes only the fields you name.
    const user = await redis.hgetall(`user:${req.params.id}:hash`)
    res.json({user})
}) 

app.listen(3000, () => {
    console.log("server is running on port 3000")
})