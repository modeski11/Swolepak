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

router.post('/buy', async(req,res) => {
    const headers = req.headers
    headers.token = headers.token?.toString() ?? ''
    const authenticate = await auth(headers.token)
    if(authenticate === null){
        res.send(JSON.stringify({"status":"error", "errors":"No Token"}))
        return false
    }
    const errors = []
    const  input = req.body
    if(input.product_id === null) errors.push("Product has to be selected")
    if(input.shipper_id === null) errors.push("Shipper has to be selected")
    if(input.payment_method === null) errors.push("A payment method has to be selected")
    if(errors.length > 0){
        res.send(JSON.stringify({"status":"error", "errors":errors}))
        return false
    }
    input.shipper_id = input.shipper_id?.toString() ?? ''
    input.payment_method = input.payment_method?.toString() ?? ''
    const getProduct = await prisma.product.findFirst({
        where:{
            product_id: parseInt(input.product_id)
        }
    })
    if(input.quantity > getProduct.quantity){
        res.send(JSON.stringify({"status":"error","errors":"Not enough stock"}))
        return false
    }
    if(getProduct === null){
        res.send(JSON.stringify({"status":"error","errors":"Product is missing"}))
        return false;
    }
    const editQuantity = await prisma.product.update({
        where:{
            product_id: input.product_id
        },
        data:{
            quantity: getProduct.quantity - input.quantity
        }
    })
    const createTransaction = await prisma.transaction.create({
        data:{
            customer_id: authenticate,
            shipper_id: input.shipper_id,
            payment_method: input.payment_method,
            product_id: input.product_id,
            quantity: input.quantity,
            seller_id: getProduct.seller_id,
            total_price: parseInt(getProduct.price) * parseInt(input.quantity),
            product_name: getProduct.product_name
        }
    })
    res.send(JSON.stringify({"status":"OK", "response":createTransaction}))
});

module.exports = router