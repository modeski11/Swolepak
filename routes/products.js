const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const req = require("express/lib/request");
const { JSON } = require("mysql/lib/protocol/constants/types");
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

router.post('/test', async (req,res) => {
    const headers = req.headers
    headers.token = headers.token?.toString() ?? ''
    console.log(await auth(headers.token))
})


router.get('/', async (req,res) => {
    const getProduct = await prisma.product.findFirst({

        where: {
            product_id: parseInt(req.query.id)
        }
    })
    if(getProduct === null){
        res.status(404).send(JSON.stringify({"status":"error","error":"Product not found"}))
        return false
    }
    res.send(getProduct)
})

router.post('/add', async (req,res) => {
    const headers = req.headers
    headers.token = headers.token?.toString() ?? ''
    const authenticate = await auth(headers.token)
    if(authenticate === null){
        res.status(403).send(JSON.stringify({"status":"error", "errors":"No Token"}))
        return false
    }
    const userdata = req.body
    const errors = [];

    if(userdata.productname === null) errors.push("Product name has to be filled")
    if(userdata.weight === null) errors.push("Weight has to be filled")
    if(userdata.quantity === null) errors.push("Quantitiy has to beb filled")
    if(userdata.price === null) errors.push("Price has to be filled")
    if(errors.length !== 0){
        res.send(JSON.stringify({"status":"error", "errors":errors}))
        return false
    }

    userdata.productname = userdata.productname?.toString() ?? ''
    userdata.description = userdata.description?.toString() ?? ''
    const findSeller = await prisma.customer.findFirst({
        where: {
            customer_id:authenticate
        }
    })
    if(findSeller === null){
        res.send(JSON.stringify({"status":"error","errors":"User id can not be found"}))
    }
    const createProduct = await prisma.product.create({
        data: {
            product_name: userdata.productname,
            weight: userdata.weight,
            quantity: userdata.quantity,
            seller_id: findSeller.customer_id,
            price: userdata.price,
            description: userdata.description
        }
    })
    if(createProduct === null){
        res.send(JSON.stringify({"status":"error","errors":"Product creation failed"}))
        return false
    }
    res.send(JSON.stringify({"status":"OK",createProduct}))
})

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
    //The feature to give error messages when one of the field returns empty
    if(input.product_id.length<=0) errors.push("Product has to be selected")
    if(input.shipper_id === null) errors.push("Shipper has to be selected")
    if(input.payment_method === null) errors.push("A payment method has to be selected")
    if(errors.length > 0){
        res.send(JSON.stringify({"status":"error", "errors":errors}))
        return false
    }
    input.shipper_id = input.shipper_id?.toString() ?? ''
    input.payment_method = input.payment_method?.toString() ?? ''
    console.log(input.product_id[0])
    const createTransaction = await prisma.transaction.create({
        data:{
            user_id: authenticate,
            shipper_id: input.shipper_id,
            payment_method: input.payment_method
        }
    })
    for(let i = 0; i < input.product_id.length; i++){
        const getProduct = await prisma.product.findFirst({
            where:{
                product_id: parseInt(input.product_id[i])
            }
        })
        if(input.quantity[i] > getProduct.quantity){
            res.send(JSON.stringify({"status":"error","errors":"Not enough stock"}))
            return false
        }
        if(getProduct === null){
            res.send({"status":"error","errors":"Product is missing"})
            return false
        }
        const editQuantity = await prisma.product.update({
            where:{
                product_id: input.product_id[i]
            },
            data:{
                quantity: getProduct.quantity - input.quantity[i]
            }
        })
        const createTransactionDetail = await prisma.transaction_detail.create({
            data:{
                transaction_id: createTransaction.transaction_id,
                product_id: parseInt(input.product_id[i]),
                quantity: parseInt(input.quantity[i])
            }
        })
    }
});

router.put('/delete', async(req,res) => {
    const headers = req.headers
    headers.token = headers.token?.toString() ?? ''
    const authenticate = await auth(headers.token)
    if(authenticate === null){
        res.send(JSON.stringify({"status":"error", "errors":"No Token"}))
        return false
    }
    const input = req.body
    const checkProduct = await prisma.product.findFirst({
        where:{
            product_id: input.product_id
        }
    })
    if(checkProduct === null){
        res.send(JSON.stringify({"status": "error", "errors":"Product not found"}))
        return false
    }
    if(checkProduct.seller_id !== authenticate){
        res.send(JSON.stringify({"status": "error", "errors":"Unauthorized"}))
        return false
    }
    const deleteProduct = await prisma.product.update({
        where:{
            product_id: input.product_id
        },
        data:{
            isAvailable: false
        }
    })
    res.send(JSON.stringify({"status":"OK", deleteProduct}));
})




module.exports = router