const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

async function auth(token){
    const findToken = await prisma.tokens.findFirst({
        where: {
            token: token
        },
    })
    if(findToken !== null){
        return findToken.user_id
    }
    return null;
}

router.get('/myorder', async(req, res) => {
    const headers = req.headers
    headers.token = headers.token?.toString() ?? ''
    const authenticate = await auth(headers.token)
    if(authenticate === null){
        res.send(JSON.stringify({"status":"error", "errors":"No Token"}))
        return false
    }
    if(authenticate !== req.body.user_id){
        res.send(JSON.stringify({"status":"error", "errors":"Unauthorized"}))
        return false
    }
    const getOrders = await prisma.transaction.findMany({
        where:{
            customer_id: req.body.user_id
        }
    })
    res.send(JSON.stringify({"status":"OK", "transactions":getOrders}))
});
router.get('/received_order', async(req, res) => {
    const headers = req.headers
    headers.token = headers.token?.toString() ?? ''
    const authenticate = await auth(headers.token)
    if(authenticate === null){
        res.send(JSON.stringify({"status":"error", "errors":"No Token"}))
        return false
    }
    if(authenticate !== req.body.user_id){
        res.send(JSON.stringify({"status":"error", "errors":"Unauthorized"}))
        return false
    }
    const getOrders = await prisma.transaction.findMany({
        where:{
            seller_id: req.body.user_id
        }
    })
    res.send(JSON.stringify({"status":"OK", "transactions":getOrders}))
});

module.exports = router