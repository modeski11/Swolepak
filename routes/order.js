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
    const getOrders = await prisma.transaction.findMany({
        where:{
            customer_id: req.body.customer_id
        }
    })
    res.send(JSON.stringify({"status":"OK", "transactions":getOrders}))
});
router.get('/received_order', async(req, res) => {
    const getOrders = await prisma.transaction.findMany({
        where:{
            seller_id: req.body.seller_id
        }
    })
    res.send(JSON.stringify({"status":"OK", "transactions":getOrders}))
});

module.exports = router