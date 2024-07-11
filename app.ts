import express, { query } from 'express';
import Redis from 'ioredis';

const app = express();

const port = process.env.PORT || 8080
const redis_host = process.env.REDIS_HOST || "127.0.0.1"
const redis_port = Number.parseInt(process.env.REDIS_PORT ?? "") || 6379

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
        if (!req.body.step_key || (req.body.step_key as string)?.length > 50 || typeof (req.body.step_key) !== "string")
            return res.status(415).send("step_key is null or step_key length greater than 50");
        if (!req.body.key_value || typeof (req.body.key_value) !== "number")
            return res.status(415).send("key_value is null or key_value type is not number");

        let result = await redis.set("bcc_letterheads:counters:" + req.body.step_key, req.body.key_value ?? 1);

        return res.status(200).send(`Succes result: ${result}`);
    }
    catch (err) {
        return res.status(500).send("Error set-step-key: " + err);
    }
})

app.get("/api/delete-key", express.json({ limit: "1mb" }), async (req, res) => {

    try {
        if (!req.query.key || (req.query.key as string)?.length > 155 || typeof (req.query.key) !== "string")
            return res.status(415).send("key is null or key length greater than 155");
        redis.del("bcc_letterheads:counters:" + req.query.key);
        redis.del("bcc_letterheads:" + req.query.key);

        return res.status(200).send(`Succes: key has been deleted`);
    }
    catch (err) {
        return res.status(500).send("Error delete-key: " + err);
    }
})

app.get("/api/get-letterhead-number/", express.json({ "limit": "1mb" }), async (req, res) => {
    try {

        if (!(req.query.key as string) || (req.query.key as string).length == 0 || (req.query.key as string).length > 155)
            return res.status(415).send("body is not exist key value");
        if (!req.query.step_key || (req.query.step_key as string).length == 0 || (req.query.step_key as string).length > 20 || typeof (req.query.step_key) !== "string")
            return res.status(415).send("body is not exist step_key value");

        const increment_key = await redis.get("bcc_letterheads:counters:" + req.query.step_key)
        const result = await redis.incrby("bcc-letterheads:" + req.query.key, increment_key ?? 1);

        return res.status(200).send(result?.toString() ?? "");
    }
    catch (err) {
        return res.status(500).send("Error get-letterhead-number(): " + err);
    }
})

app.listen(port, () => {
    console.log("redis_service are listening port : " + port);
});