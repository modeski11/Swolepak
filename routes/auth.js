const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

router.get('/', async(req,res)=> {
    const userdata = req.body
    const findToken = await prisma.tokens.findFirst({
        where: {
            token: userdata.tokens
        }
    })
    if(findToken !== null){
        const userFromToken = await prisma.customer.findFirst({
            where: {
                customer_id: findToken.user_id
            }
        })
        res.send(JSON.stringify({"status":"OK", userFromToken}))
        return false
    }
    res.send(JSON.stringify({"status":"No matching token"}))
})

module.exports = router