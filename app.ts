import express, { query } from 'express';
import Redis from 'ioredis';

const app = express();

const port = process.env.PORT || 8080
const redis_host = process.env.REDIHOST || "127.0.0.1"
const redis_port = Number.parseInt(process.env.REDISPORT ?? "") || 6379

app.use(express.json(
    { "limit": "1mb" }
))

const redis = new Redis({
    port: redis_port, // Redis port
    host: redis_host, // Redis host
});

app.get("/api/health", (req, res) => {
    res.end("Service workng!");
});

app.post("/api/set-step-key", express.json({ limit: "1mb" }), async (req, res) => {

    try {
        if (!req.body.step_key || (req.body.step_key as string)?.length > 20 || typeof (req.body.step_key) !== "string")
            return res.status(415).send("step_key is null or step_key length greater than 20");
        if (!req.body.key_value || typeof (req.body.key_value) !== "number")
            return res.status(415).send("key_value is null or key_value type is not number");

        let result = await redis.set("bcc-letterheads:counters:" + req.body.step_key, req.body.key_value);
        return res.status(200).send(`Succes result: ${result}`);
    }
    catch (err) {
        return res.status(500).send("Error set-step-key: " + err);
    }
})

app.get("/api/get-letterhead-number/", express.json({ "limit": "1mb" }), async (req, res) => {
    try {

        if (!(req.query.key as string) || (req.query.key as string).length == 0 || (req.query.key as string).length > 155)
            return res.status(415).send("body is not exist key value");
        if (!req.query.step_key || (req.query.step_key as string).length == 0 || (req.query.step_key as string).length > 20 || typeof (req.query.step_key) !== "string")
            return res.status(415).send("body is not exist increment_key value");

        const increment_key = await redis.get("bcc-letterheads:counters:" + req.query.step_key)
        if(!increment_key)
            return res.status(415).send("increment_key is not exist");
        let result = await redis.incrby("bcc-letterheads:" + req.query.key, increment_key ?? 1);

        return res.status(200).send({ letterhead_number: result });
    }
    catch (err) {
        return res.status(500).send("Error get-letterhead-number(): " + err);
    }
})

app.listen(port, () => {
    console.log("redis_service are listening port : " + port);
});