import express from 'express';
import Redis from 'ioredis';

const app = express();
const port = process.env.PORT || 8080
const redis_port = Number.parseInt(process.env.REDISPORT ?? "") || 6379
const username = process.env.USERNAME || ''
const password = process.env.PASSWORD || ''
const db = process.env.DB || 0

app.use(express.json(
    { "limit": "10mb" }
))

app.get("/api/health", function (req, res) {
    res.end("Service workng!");
});

app.get("/api/get-letterhead-number", express.json({ "limit": "10mb" }), async function (req, res) {
    try {
        if (!(req.body.key as string) || (req.body.key as string).length == 0)
            return res.status(415).send("body is not exist key value");

        const redis = new Redis({
            port: redis_port, // Redis port
            // host: "127.0.0.1", // Redis host
            // username: "", 
            // password: "",
            // db: 0, // 
        });
        let result = await redis.get(req.body.key);
        if (!result) {
            redis.set(req.body.key, 1)
            result = await redis.get(req.body.key);
        }

        redis.set(req.body.key, Number.parseInt(result!) + 1);
        return res.status(200).send(result);
    }
    catch (err) {
        return res.status(500).send("Error get-number(): " + err);
    }
})

app.listen(port, () => {
    console.log("redis_service are listening port : " + port);
});