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

router.get('/bestseller', async(req,res) => {
    const getBestSeller = await prisma.best_seller.findMany({})
    res.send(JSON.stringify({"status":"OK", "response":getBestSeller}))
})

router.get('/category/:key', async(req, res) => {
    input = req.params.key
    input = input?.toString() ?? ''
    const findProduct = await prisma.product.findMany({
        where:{
            category: input
        }
    })
    res.send(JSON.stringify({findProduct}));
})

router.get('/search/:key', async(req, res) => {
    input = req.params.key
    input = input?.toString() ?? ''
    const findProduct = await prisma.product.findMany({
        where:{
            product_name: {
                startsWith: input
            }
        }
    })
    res.send(JSON.stringify({findProduct}));
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
    if(userdata.imageurl === null) errors.push("Picture of the product has to be uploaded")
    if(userdata.productname === null) errors.push("Product name has to be filled")
    if(userdata.weight === null) errors.push("Weight has to be filled")
    if(userdata.quantity === null) errors.push("Quantitiy has to beb filled")
    if(userdata.price === null) errors.push("Price has to be filled")
    if(userdata.category === null) errors.push("Category has to be filled")
    if(errors.length !== 0){
        res.send(JSON.stringify({"status":"error", "errors":errors}))
        return false
    }
    userdata.imageurl = userdata.imageurl?.toString() ?? ''
    userdata.productname = userdata.productname?.toString() ?? ''
    userdata.description = userdata.description?.toString() ?? ''
    userdata.category = userdata.category?.toString() ?? ''
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
            description: userdata.description,
            category: userdata.category,
            imageurl: userdata.imageurl
        }
    })
    if(createProduct === null){
        res.send(JSON.stringify({"status":"error","errors":"Product creation failed"}))
        return false
    }
    res.send(JSON.stringify({"status":"OK",createProduct}))
})


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
});




module.exports = router