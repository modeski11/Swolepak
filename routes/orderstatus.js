const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

router.put('/next', async(req,res) => {
    const input = req.body
    const getTransaction = await prisma.transaction.findFirst({
        where:{
            transaction_id: input.transaction_id
        }
    })
    if(getTransaction === null){
        res.send(JSON.stringify({"status":"error", "errors":"Transaction does not exist"}))
        return false
    }
    if(getTransaction.order_status === 4){
        res.send(JSON.stringify({"status":"error", "errors":"Transaction has finished"}))
    }
    const updateTransaction = await prisma.transaction.update({
        where:{
            transaction_id:input.transaction_id
        },
        data:{
            order_status: getTransaction.order_status+1
        }
    })
    const checkStatus = await prisma.status.findFirst({
        where:{
            status_id: updateTransaction.order_status
        }
    })
    res.send(JSON.stringify({"status":"OK", "response":checkStatus.status_name}))
})

module.exports = router