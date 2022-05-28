const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const router = require("express").Router();

router.get('/', async (req,res) => {
    const getProduct = await prisma.products.findFirst({
        where: {
            product_id: req.query.id
        }
    })
    if(getProduct === null){
        res.status(404).send(JSON.stringify({"status":"error","error":"Product not found"}))
        return false
    }
    res.send(getProduct)
})


module.exports = router