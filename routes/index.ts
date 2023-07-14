// PWA-APP-PEDIDOS
import express from 'express';
let router = express.Router();

router.get('/', function (req, res, next) {
    res.json({
        status: "success",
        message: "API PITER-CHAT-BOT V1",
        data: {
            "version_number": "v1.0.0"
        }
    })
});

router.post('/init-user-session', function (req: any, res, next) {
    const userSession = req.body.userSession;
    const rpt = { userSession }
    res.status(200).send(rpt);
});

export = router;

