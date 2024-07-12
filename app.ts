import express, { query } from 'express';
import Redis from 'ioredis';
import { KEY_LIMIT, STEP_KEY_LIMIT } from './constans.';

const app = express();

const port = process.env.PORT || 8080;
const redis_host = process.env.REDIS_HOST || '127.0.0.1';
const redis_port = Number.parseInt(process.env.REDIS_PORT ?? '') || 6379;

app.use(express.json(
    { 'limit': '1mb' }
));

const redis = new Redis({
    port: redis_port, // Redis port
    host: redis_host, // Redis host
});

app.get('/api/health', (req, res) => {
    res.end('Service workng!');
});


app.post('/api/set-step-key', express.json({ limit: '1mb' }), async (req, res) => {

    try {
        if (!req.body.step_key || (req.body.step_key as string)?.length > STEP_KEY_LIMIT || typeof (req.body.step_key) !== 'string')
            return res.status(400).send(`step_key is null or step_key length greater than ${STEP_KEY_LIMIT}`);
        if (!req.body.key_value || typeof (req.body.key_value) !== 'number')
            return res.status(400).send('key_value is null or key_value type is not number');

        const result = await redis.set(`bcc_letterheads:counters:${req.body.step_key}`, req.body.key_value ?? 1);

        return res.status(200).send(`Succes result: ${result}`);
    }
    catch (err) {
        return res.status(500).send(`Error set-step-key: ${err}`);
    }
});

app.post('/api/set-letterhead-key', express.json({ limit: '1mb' }), async (req, res) => {

    try {
        if (!req.body.letterhead_key || (req.body.letterhead_key as string)?.length > KEY_LIMIT || typeof (req.body.letterhead_key) !== 'string')
            return res.status(400).send(`letterhead_key is null or letterhead_key length greater than ${KEY_LIMIT}`);
        if (!req.body.key_value || typeof (req.body.key_value) !== 'number')
            return res.status(400).send('key_value is null or key_value type is not number');

        const result = await redis.set(`bcc_letterheads:${req.body.letterhead_key}`, req.body.key_value ?? 1);

        return res.status(200).send(`Succes result: ${result}`);
    }
    catch (err) {
        return res.status(500).send(`Error set-step-key: ${err}`);
    }
});

app.delete('/api/delete-key', express.json({ limit: '1mb' }), async (req, res) => {

    try {
        if (!req.query.key || (req.query.key as string)?.length > KEY_LIMIT || typeof (req.query.key) !== 'string')
            return res.status(400).send(`key is null or key length greater than ${KEY_LIMIT}`);

        redis.del(`bcc_letterheads:counters:${req.query.key}`);
        redis.del(`bcc_letterheads:${req.query.key}`);

        return res.status(200).send(`Succes: key ${req.query.key} has been deleted`);
    }
    catch (err) {
        return res.status(500).send(`Error delete-key: ${err}`);
    }
});

app.get('/api/get-letterhead-number/', express.json({ 'limit': '1mb' }), async (req, res) => {
    try {

        if (!(req.query.key as string) || (req.query.key as string).length == 0 || (req.query.key as string).length > KEY_LIMIT)
            return res.status(400).send(`body is not exist key value or key length greater than ${KEY_LIMIT}`);
        if (!req.query.step_key || (req.query.step_key as string).length == 0 || (req.query.step_key as string).length > STEP_KEY_LIMIT || typeof (req.query.step_key) !== 'string')
            return res.status(400).send(`body is not exist step_key value or key length greater than ${STEP_KEY_LIMIT}`);

        const increment_key = await redis.get(`bcc_letterheads:counters:${req.query.step_key}`)
        const result = await redis.incrby(`bcc_letterheads:${req.query.key}`, increment_key ?? 1);

        return res.status(200).send(result?.toString() ?? '');
    }
    catch (err) {
        return res.status(500).send(`Error get-letterhead-number(): ${err}`);
    }
});

app.get('/api/get-key-list/', express.json({ 'limit': '1mb' }), async (req, res) => {
    try {

        const redis_keys = await redis.keys("*bcc*");

        const key_value = await Promise.all(
            redis_keys.map(async x => ({
                key: x,
                value: await redis.get(x),
            }) as {
                key: string,
                value: string
            }))

        return res.status(200).send(key_value);
    }
    catch (err) {
        return res.status(500).send(`Error get-key-list(): ${err}`);
    }
});

app.listen(port, () => {
    console.log(`BCC_NUMERATOR_SERVICE listening port : ${port}`);
});